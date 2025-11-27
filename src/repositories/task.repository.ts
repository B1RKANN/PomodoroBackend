import Task, { ITask } from '../models/task.model';

export class TaskRepository {
    async create(data: Partial<ITask>): Promise<ITask> {
        const task = new Task(data);
        return await task.save();
    }

    async findById(id: string): Promise<ITask | null> {
        return await Task.findById(id);
    }

    async deleteById(id: string): Promise<void> {
        await Task.deleteOne({ _id: id });
    }

    async softDeleteById(id: string): Promise<ITask | null> {
        return await Task.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    }

    async complete(id: string): Promise<ITask | null> {
        return await Task.findByIdAndUpdate(id, { isCompleted: true, completedAt: new Date() }, { new: true });
    }

    async countCompletedByUser(userId: string, start?: Date, end?: Date): Promise<number> {
        const q: any = { userId, isCompleted: true, deletedAt: null };
        if (start || end) {
            q.completedAt = {};
            if (start) q.completedAt.$gte = start;
            if (end) q.completedAt.$lte = end;
        }
        return await Task.countDocuments(q);
    }
}

