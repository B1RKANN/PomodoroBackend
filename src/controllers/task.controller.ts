import { Response } from 'express';
import { TaskService } from '../services/task.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class TaskController {
    private service: TaskService;

    constructor() { this.service = new TaskService(); }

    create = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id as string;
            const { title, description } = req.body;
            const task = await this.service.create(userId, { title, description });
            res.status(201).json(task);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    complete = async (req: AuthRequest, res: Response) => {
        try {
            const taskId = req.params.id;
            const task = await this.service.complete(taskId);
            if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
            res.status(200).json(task);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    delete = async (req: AuthRequest, res: Response) => {
        try {
            const taskId = req.params.id;
            const soft = String(req.query.soft || 'true') === 'true';
            const result = await this.service.delete(taskId, soft);
            if (soft) res.status(200).json(result);
            else res.status(204).send();
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };
}

