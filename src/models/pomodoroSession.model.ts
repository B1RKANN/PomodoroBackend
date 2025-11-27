import mongoose, { Schema, Document } from 'mongoose';

export interface IPomodoroSession extends Document {
    userId: string;
    taskId?: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}

const PomodoroSessionSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    taskId: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model<IPomodoroSession>('PomodoroSession', PomodoroSessionSchema);

