import mongoose, { Schema, Document } from 'mongoose';

export enum RoomType {
    SHARED_POMODORO = 'SHARED_POMODORO',
    INDIVIDUAL_POMODORO = 'INDIVIDUAL_POMODORO'
}

export interface IParticipant {
    userId: string;
    socketId: string;
    nickname: string;
}

export interface IRoom extends Document {
    name: string;
    type: RoomType;
    password?: string;
    hostUserId: string; // User ID of the host
    participants: IParticipant[];
    isActive: boolean;
    timer: {
        minutes: number;
        seconds: number;
        isRunning: boolean;
        remainingSeconds: number;
    };
    createdAt: Date;
}

const RoomSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: Object.values(RoomType), required: true },
    password: { type: String },
    hostUserId: { type: String, required: true },
    participants: [{
        userId: { type: String, required: true },
        socketId: { type: String, required: true },
        nickname: { type: String, required: true }
    }],
    isActive: { type: Boolean, default: true },
    timer: {
        minutes: { type: Number, default: 25 },
        seconds: { type: Number, default: 0 },
        isRunning: { type: Boolean, default: false },
        remainingSeconds: { type: Number, default: 25 * 60 }
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IRoom>('Room', RoomSchema);
