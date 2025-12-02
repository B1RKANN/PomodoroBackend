import { Server, Socket } from 'socket.io';
import Room, { RoomType } from '../models/room.model';
import { authMiddleware, AuthenticatedSocket } from './middleware/auth.middleware';
import User from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

interface TimerState {
    intervalId?: NodeJS.Timeout;
    remainingSeconds: number;
    isRunning: boolean;
}

// In-memory storage for active timers
const activeTimers: Map<string, TimerState> = new Map();

interface ChatMessage {
    id: string;
    roomName: string;
    userId: string;
    nickname: string;
    content: string;
    timestamp: number;
}

const roomMessages: Map<string, ChatMessage[]> = new Map();
const pendingHostClosures: Map<string, NodeJS.Timeout> = new Map();

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

                if (updatedRoom && updatedRoom.hostUserId === authSocket.data.userId) {
                    const rid = updatedRoom._id.toString();
                    const t = pendingHostClosures.get(rid);
                    if (t) {
                        clearTimeout(t);
                        pendingHostClosures.delete(rid);
                        console.log('[room] pending auto-close canceled, host rejoined:', name);
                    }
                }

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
            console.log('[socket] leave_room received from', authSocket.data.userId, 'room', data.roomName);
            await handleLeaveRoom(authSocket, data.roomName, io, true, 'leave_event');
        });

        authSocket.on('send_message', async (data: { roomName: string; content: string }, ack?: (response: any) => void) => {
            try {
                const room = await Room.findOne({ name: data.roomName });
                if (!room) {
                    if (ack) ack({ success: false, error: 'Room not found' });
                    return;
                }
                const isParticipant = room.participants.some(p => p.userId === authSocket.data.userId);
                if (!isParticipant) {
                    if (ack) ack({ success: false, error: 'Not a participant' });
                    return;
                }
                const content = (data.content || '').trim();
                if (!content) {
                    if (ack) ack({ success: false, error: 'Empty content' });
                    return;
                }
                const message: ChatMessage = {
                    id: uuidv4(),
                    roomName: data.roomName,
                    userId: authSocket.data.userId,
                    nickname: userNickname,
                    content,
                    timestamp: Date.now()
                };
                const list = roomMessages.get(data.roomName) || [];
                list.push(message);
                if (list.length > 1000) list.shift();
                roomMessages.set(data.roomName, list);
                io.to(data.roomName).emit('message_received', message);
                if (ack) ack({ success: true, id: message.id });
            } catch (error) {
                if (ack) ack({ success: false, error: String(error) });
            }
        });

        authSocket.on('fetch_messages', async (data: { roomName: string; limit?: number }, ack?: (response: any) => void) => {
            try {
                const room = await Room.findOne({ name: data.roomName });
                if (!room) {
                    if (ack) ack({ success: false, error: 'Room not found' });
                    return;
                }
                const isParticipant = room.participants.some(p => p.userId === authSocket.data.userId);
                if (!isParticipant) {
                    if (ack) ack({ success: false, error: 'Not a participant' });
                    return;
                }
                const all = roomMessages.get(data.roomName) || [];
                const limit = Math.max(1, Math.min(data.limit || 50, 200));
                const slice = all.slice(Math.max(0, all.length - limit));
                authSocket.emit('messages_history', slice);
                if (ack) ack({ success: true, count: slice.length });
            } catch (error) {
                if (ack) ack({ success: false, error: String(error) });
            }
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
                if (!room || room.type !== RoomType.SHARED_POMODORO) return;

                if (!room.participants.some(p => p.userId === authSocket.data.userId)) return;

                const roomId = room._id.toString();
                let timerState = activeTimers.get(roomId);
                const newRemaining = data.minutes * 60;

                if (!timerState) {
                    timerState = { remainingSeconds: newRemaining, isRunning: false };
                    activeTimers.set(roomId, timerState);
                } else {
                    timerState.remainingSeconds = newRemaining;
                }

                room.timer.minutes = data.minutes;
                room.timer.remainingSeconds = newRemaining;
                room.timer.isRunning = timerState.isRunning;
                await room.save();

                io.to(data.roomName).emit('timer_update', {
                    remainingSeconds: timerState.remainingSeconds,
                    isRunning: timerState.isRunning
                });

            } catch (error) {
                console.error(error);
            }
        });

        authSocket.on('start_timer', async (data: { roomName: string }, ack?: (response: any) => void) => {
            try {
                console.log('[socket] start_timer received:', data);
                const room = await Room.findOne({ name: data.roomName });
                if (!room || room.type !== RoomType.SHARED_POMODORO) {
                    console.log('[socket] start_timer failed: invalid room');
                    if (ack) ack({ success: false, error: 'Invalid room' });
                    return;
                }
                if (!room.participants.some(p => p.userId === authSocket.data.userId)) {
                    console.log('[socket] start_timer failed: not a participant');
                    if (ack) ack({ success: false, error: 'Not a participant' });
                    return;
                }

                const roomId = room._id.toString();
                let timerState = activeTimers.get(roomId);
                if (!timerState) {
                    timerState = {
                        remainingSeconds: room.timer.remainingSeconds,
                        isRunning: false
                    };
                    activeTimers.set(roomId, timerState);
                    console.log('[socket] new timer state created');
                }

                if (timerState.isRunning) {
                    console.log('[socket] timer already running');
                    if (ack) ack({ success: false, error: 'Timer already running' });
                    return;
                }

                // Clear any existing interval
                if (timerState.intervalId) {
                    console.log('[socket] clearing existing interval before start');
                    clearInterval(timerState.intervalId);
                    timerState.intervalId = undefined;
                }

                timerState.isRunning = true;
                activeTimers.set(roomId, timerState);
                console.log('[socket] timer starting, remainingSeconds:', timerState.remainingSeconds, 'isRunning:', timerState.isRunning);

                const fullDuration = room.timer.minutes * 60;
                const action = (timerState.remainingSeconds < fullDuration && timerState.remainingSeconds > 0) ? 'resume' : 'start';
                io.to(data.roomName).emit('timer_started', { nickname: userNickname, userId: authSocket.data.userId, action });
                if (ack) ack({ success: true });

                await Room.findByIdAndUpdate(room._id, {
                    'timer.isRunning': true
                });

                timerState.intervalId = setInterval(async () => {
                    const currentState = activeTimers.get(roomId);

                    if (!currentState || !currentState.isRunning) {
                        if (timerState.intervalId) {
                            clearInterval(timerState.intervalId);
                            timerState.intervalId = undefined;
                        }
                        console.log('[socket] interval tick stopped - timer not running');
                        return;
                    }

                    if (currentState.remainingSeconds > 0) {
                        currentState.remainingSeconds--;
                        io.to(data.roomName).emit('timer_tick', { remainingSeconds: currentState.remainingSeconds });
                    } else {
                        currentState.isRunning = false;
                        if (currentState.intervalId) {
                            clearInterval(currentState.intervalId);
                            currentState.intervalId = undefined;
                        }
                        io.to(data.roomName).emit('timer_finished');
                        activeTimers.delete(roomId);
                        console.log('[socket] timer finished');

                        await Room.findByIdAndUpdate(room._id, {
                            'timer.isRunning': false,
                            'timer.remainingSeconds': 0
                        });
                    }
                }, 1000);

                console.log('[socket] interval started, intervalId:', timerState.intervalId);

            } catch (error) {
                console.error('[socket] start_timer error:', error);
                if (ack) ack({ success: false, error: String(error) });
            }
        });

        authSocket.on('pause_timer', async (data: { roomName: string }, ack?: (response: any) => void) => {
            try {
                console.log('[socket] pause_timer received:', data);
                const room = await Room.findOne({ name: data.roomName });

                if (!room || room.type !== RoomType.SHARED_POMODORO) {
                    console.log('[socket] pause_timer failed: room not found or wrong type');
                    if (ack) ack({ success: false, error: 'Invalid room' });
                    return;
                }

                if (!room.participants.some(p => p.userId === authSocket.data.userId)) {
                    console.log('[socket] pause_timer failed: user not participant');
                    if (ack) ack({ success: false, error: 'Not a participant' });
                    return;
                }

                const timerState = activeTimers.get(room._id.toString());
                console.log('[socket] timerState:', timerState);

                if (timerState) {  // ← SADECE timerState kontrolü, isRunning kontrolü yok
                    if (timerState.intervalId) {
                        clearInterval(timerState.intervalId);
                        timerState.intervalId = undefined;
                        console.log('[socket] interval cleared');
                    }
                    timerState.isRunning = false;  // ← Her durumda false yap
                    // KRİTİK: State değişikliğini Map'e kaydetmeliyiz!
                    activeTimers.set(room._id.toString(), timerState);
                    io.to(data.roomName).emit('timer_paused', { nickname: userNickname, userId: authSocket.data.userId });
                    if (ack) ack({ success: true });
                    console.log('[socket] timer paused successfully');

                    await Room.findByIdAndUpdate(room._id, {
                        'timer.isRunning': false,
                        'timer.remainingSeconds': timerState.remainingSeconds
                    });
                } else {
                    console.log('[socket] timer not found');
                    if (ack) ack({ success: false, error: 'Timer not found' });
                }
            } catch (error) {
                console.error('[socket] pause_timer error:', error);
                if (ack) ack({ success: false, error: String(error) });
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

                io.to(data.roomName).emit('timer_stopped', { nickname: userNickname, userId: authSocket.data.userId });

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
            console.log('[socket] disconnect', authSocket.data.userId, authSocket.id);
            // Find rooms where user is participant
            const rooms = await Room.find({ "participants.userId": authSocket.data.userId });
            for (const room of rooms) {
                await handleLeaveRoom(authSocket, room.name, io, false, 'disconnect');
            }
        });
    });
};

async function handleLeaveRoom(socket: AuthenticatedSocket, roomName: string, io: Server, hostImmediate: boolean = false, origin: string = 'leave_event') {
    try {
        const room = await Room.findOne({ name: roomName });
        if (!room) return;

        const userId = socket.data.userId;

        if (room.hostUserId === userId) {
            const rid = room._id.toString();
            const timerState = activeTimers.get(rid);
            if (timerState && timerState.intervalId) clearInterval(timerState.intervalId);
            activeTimers.delete(rid);

            const existing = pendingHostClosures.get(rid);
            if (existing) {
                clearTimeout(existing);
                pendingHostClosures.delete(rid);
            }

            if (hostImmediate) {
                await Room.deleteOne({ _id: rid });
                roomMessages.delete(roomName);
                io.to(roomName).emit('room_closed', { message: 'Host left the room (leave_room).' });
                io.in(roomName).socketsLeave(roomName);
                console.log('[room] immediate close by host leave_room, room', roomName, 'origin', origin);
            } else {
                room.participants = room.participants.filter(p => p.userId !== userId);
                await room.save();
                io.to(roomName).emit('participant_left', { userId, participants: room.participants });
                console.log('[room] host removed from participants for timeout tracking, room', roomName);
                const timeoutId = setTimeout(async () => {
                    try {
                        const latest = await Room.findById(rid);
                        if (!latest) return;
                        const hostBack = latest.participants.some(p => p.userId === latest.hostUserId);
                        if (hostBack) return;
                        await Room.deleteOne({ _id: rid });
                        roomMessages.delete(roomName);
                        io.to(roomName).emit('room_closed', { message: 'Host disconnect timeout reached (30s).' });
                        io.in(roomName).socketsLeave(roomName);
                        pendingHostClosures.delete(rid);
                        console.log('[room] auto-close after timeout, room', roomName);
                    } catch (e) {}
                }, 30000);
                pendingHostClosures.set(rid, timeoutId);
                console.log('[room] host disconnected, scheduled auto-close in 30s, room', roomName, 'origin', origin);
            }
        } else {
            // Participant leaves
            room.participants = room.participants.filter(p => p.userId !== userId);
            await room.save();
            socket.leave(roomName);
            socket.emit('room_left', { roomName, userId, participants: room.participants });
            io.to(roomName).emit('participant_left', { userId, participants: room.participants });
            console.log('[room] participant left', userId, 'room', roomName, 'origin', origin);
        }
    } catch (error) {
        console.error("Error handling leave room:", error);
    }
}
