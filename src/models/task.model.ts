import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    userId: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    completedAt?: Date;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);

