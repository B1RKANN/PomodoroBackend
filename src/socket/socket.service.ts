import { Server, Socket } from 'socket.io';
import Room, { RoomType } from '../models/room.model';
import { authMiddleware, AuthenticatedSocket } from './middleware/auth.middleware';
import User from '../models/user.model';

interface TimerState {
    intervalId?: NodeJS.Timeout;
    remainingSeconds: number;
    isRunning: boolean;
}

// In-memory storage for active timers
const activeTimers: Map<string, TimerState> = new Map();

export const initializeSocket = (io: Server) => {
    // Apply Auth Middleware
    io.use(authMiddleware);

    io.on('connection', async (socket: Socket) => {
        const authSocket = socket as AuthenticatedSocket;
        console.log(`User connected: ${authSocket.data.userId} (${authSocket.id})`);

        // Fetch user nickname for convenience
        let userNickname = 'Unknown';
        try {
            const user = await User.findById(authSocket.data.userId);
            if (user) userNickname = user.nickname;
        } catch (e) { console.error("Error fetching user", e); }


        // --- ROOM MANAGEMENT ---

        authSocket.on('create_room', async (data: { name: string; type: RoomType; password?: string }) => {
            try {
                const { name, type, password } = data;
                const existingRoom = await Room.findOne({ name });
                if (existingRoom) {
                    authSocket.emit('error', { message: 'Room name already exists' });
                    return;
                }

                const newRoom = new Room({
                    name,
                    type,
                    password,
                    hostUserId: authSocket.data.userId,
                    participants: [{
                        userId: authSocket.data.userId,
                        socketId: authSocket.id,
                        nickname: userNickname
                    }],
                    timer: {
                        minutes: 25,
                        remainingSeconds: 25 * 60
                    }
                });

                await newRoom.save();
                authSocket.join(name);
                authSocket.emit('room_created', newRoom);
                console.log(`Room created: ${name} by ${authSocket.data.userId}`);
            } catch (error) {
                console.error(error);
                authSocket.emit('error', { message: 'Failed to create room' });
            }
        });

        authSocket.on('join_room', async (data: { name: string; password?: string }) => {
            try {
                const { name, password } = data;
                const room = await Room.findOne({ name });

                if (!room) {
                    authSocket.emit('error', { message: 'Room not found' });
                    return;
                }

                if (room.password && room.password !== password) {
                    authSocket.emit('error', { message: 'Incorrect password' });
                    return;
                }

                // Check if already joined
                const isParticipant = room.participants.some(p => p.userId === authSocket.data.userId);
                if (!isParticipant) {
                    room.participants.push({
                        userId: authSocket.data.userId,
                        socketId: authSocket.id,
                        nickname: userNickname
                    });
                    await room.save();
                } else {
                    // Update socket ID if rejoining
                    await Room.updateOne(
                        { _id: room._id, "participants.userId": authSocket.data.userId },
                        { $set: { "participants.$.socketId": authSocket.id } }
                    );
                }

                authSocket.join(name);

                // Fetch updated room
                const updatedRoom = await Room.findById(room._id);

                authSocket.emit('room_joined', updatedRoom);
                io.to(name).emit('participant_joined', {
                    userId: authSocket.data.userId,
                    nickname: userNickname,
                    participants: updatedRoom?.participants
                });

                // Send current timer state if exists
                if (room.type === RoomType.SHARED_POMODORO) {
                    const timerState = activeTimers.get(room._id.toString());
                    if (timerState) {
                        authSocket.emit('timer_update', {
                            remainingSeconds: timerState.remainingSeconds,
                            isRunning: timerState.isRunning
                        });
                    }
                }

                console.log(`User ${authSocket.data.userId} joined room ${name}`);
            } catch (error) {
                console.error(error);
                authSocket.emit('error', { message: 'Failed to join room' });
            }
        });

        authSocket.on('leave_room', async (data: { roomName: string }) => {
            await handleLeaveRoom(authSocket, data.roomName, io);
        });

        authSocket.on('get_room', async (data: { roomName: string }) => {
            try {
                const room = await Room.findOne({ name: data.roomName });
                if (room) {
                    authSocket.emit('room_details', room);
                } else {
                    authSocket.emit('error', { message: 'Room not found' });
                }
            } catch (error) {
                authSocket.emit('error', { message: 'Failed to get room details' });
            }
        });

        authSocket.on('list_rooms', async () => {
            try {
                const rooms = await Room.find({ isActive: true }).select('-password');
                authSocket.emit('rooms_list', rooms);
            } catch (error) {
                authSocket.emit('error', { message: 'Failed to list rooms' });
            }
        });

        // --- TIMER MANAGEMENT (SHARED) ---

        authSocket.on('set_timer', async (data: { roomName: string; minutes: number }) => {
            try {
                const room = await Room.findOne({ name: data.roomName });
                // Allow any participant to set timer in Shared Mode? 
                // Requirement: "Shared Control: In SHARED_POMODORO mode, ensure all participants can access start, pause, and stop functions."
                // Assuming Set Timer is also shared.
                if (!room || room.type !== RoomType.SHARED_POMODORO) return;

                // Check if user is participant
                if (!room.participants.some(p => p.userId === authSocket.data.userId)) return;

                room.timer.minutes = data.minutes;
                room.timer.remainingSeconds = data.minutes * 60;
                room.timer.isRunning = false;
                await room.save();

                // Update in-memory state
                activeTimers.set(room._id.toString(), {
                    remainingSeconds: data.minutes * 60,
                    isRunning: false
                });

                io.to(data.roomName).emit('timer_update', {
                    remainingSeconds: room.timer.remainingSeconds,
                    isRunning: false
                });

            } catch (error) {
                console.error(error);
            }
        });

        authSocket.on('start_timer', async (data: { roomName: string }) => {
            try {
                const room = await Room.findOne({ name: data.roomName });
                if (!room || room.type !== RoomType.SHARED_POMODORO) return;
                if (!room.participants.some(p => p.userId === authSocket.data.userId)) return;

                let timerState = activeTimers.get(room._id.toString());
                if (!timerState) {
                    timerState = {
                        remainingSeconds: room.timer.remainingSeconds,
                        isRunning: false
                    };
                }

                if (timerState.isRunning) return;

                timerState.isRunning = true;
                activeTimers.set(room._id.toString(), timerState);

                io.to(data.roomName).emit('timer_started');

                if (timerState.intervalId) clearInterval(timerState.intervalId);

                timerState.intervalId = setInterval(async () => {
                    if (timerState && timerState.remainingSeconds > 0) {
                        timerState.remainingSeconds--;
                        io.to(data.roomName).emit('timer_tick', { remainingSeconds: timerState.remainingSeconds });
                    } else if (timerState) {
                        timerState.isRunning = false;
                        clearInterval(timerState.intervalId!);
                        io.to(data.roomName).emit('timer_finished');
                        activeTimers.delete(room._id.toString());

                        await Room.findByIdAndUpdate(room._id, {
                            'timer.isRunning': false,
                            'timer.remainingSeconds': 0
                        });
                    }
                }, 1000);

            } catch (error) {
                console.error(error);
            }
        });

        authSocket.on('pause_timer', async (data: { roomName: string }) => {
            try {
                const room = await Room.findOne({ name: data.roomName });
                if (!room || room.type !== RoomType.SHARED_POMODORO) return;
                if (!room.participants.some(p => p.userId === authSocket.data.userId)) return;

                const timerState = activeTimers.get(room._id.toString());
                if (timerState && timerState.isRunning) {
                    timerState.isRunning = false;
                    if (timerState.intervalId) clearInterval(timerState.intervalId);
                    io.to(data.roomName).emit('timer_paused');
                }
            } catch (error) {
                console.error(error);
            }
        });

        authSocket.on('stop_timer', async (data: { roomName: string }) => {
            try {
                const room = await Room.findOne({ name: data.roomName });
                if (!room || room.type !== RoomType.SHARED_POMODORO) return;
                if (!room.participants.some(p => p.userId === authSocket.data.userId)) return;

                const timerState = activeTimers.get(room._id.toString());
                if (timerState) {
                    if (timerState.intervalId) clearInterval(timerState.intervalId);
                    activeTimers.delete(room._id.toString());
                }

                io.to(data.roomName).emit('timer_stopped');

                await Room.findByIdAndUpdate(room._id, {
                    'timer.isRunning': false,
                    'timer.remainingSeconds': 0
                });

            } catch (error) {
                console.error(error);
            }
        });

        // --- INDIVIDUAL STATUS UPDATES ---
        authSocket.on('update_status', async (data: { roomName: string; status: any }) => {
            authSocket.to(data.roomName).emit('user_status_update', { userId: authSocket.data.userId, status: data.status });
        });


        authSocket.on('disconnect', async () => {
            console.log(`User disconnected: ${authSocket.data.userId}`);
            // Find rooms where user is participant
            const rooms = await Room.find({ "participants.userId": authSocket.data.userId });
            for (const room of rooms) {
                await handleLeaveRoom(authSocket, room.name, io);
            }
        });
    });
};

async function handleLeaveRoom(socket: AuthenticatedSocket, roomName: string, io: Server) {
    try {
        const room = await Room.findOne({ name: roomName });
        if (!room) return;

        const userId = socket.data.userId;

        // If Host leaves -> Delete Room
        if (room.hostUserId === userId) {
            // Stop timer if running
            const timerState = activeTimers.get(room._id.toString());
            if (timerState && timerState.intervalId) clearInterval(timerState.intervalId);
            activeTimers.delete(room._id.toString());

            await Room.deleteOne({ _id: room._id });
            io.to(roomName).emit('room_closed', { message: 'Host left the room.' });
            io.in(roomName).socketsLeave(roomName); // Force everyone out
            console.log(`Room ${roomName} deleted because host left.`);
        } else {
            // Participant leaves
            room.participants = room.participants.filter(p => p.userId !== userId);
            await room.save();
            socket.leave(roomName);
            io.to(roomName).emit('participant_left', { userId, participants: room.participants });
            console.log(`User ${userId} left room ${roomName}`);
        }
    } catch (error) {
        console.error("Error handling leave room:", error);
    }
}
