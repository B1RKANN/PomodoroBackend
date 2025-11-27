import { TaskRepository } from '../repositories/task.repository';
import { ITask } from '../models/task.model';

export class TaskService {
    private repo: TaskRepository;

    constructor() {
        this.repo = new TaskRepository();
    }

    async create(userId: string, input: { title: string; description?: string }): Promise<ITask> {
        return await this.repo.create({ userId, title: input.title, description: input.description });
    }

    async complete(taskId: string): Promise<ITask | null> {
        return await this.repo.complete(taskId);
    }

    async delete(taskId: string, soft = true): Promise<void | ITask | null> {
        if (soft) {
            return await this.repo.softDeleteById(taskId);
        }
        await this.repo.deleteById(taskId);
    }
}

