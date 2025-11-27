import { Response } from 'express';
import { PomodoroService } from '../services/pomodoro.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class PomodoroController {
    private service: PomodoroService;
    constructor() { this.service = new PomodoroService(); }

    record = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id as string;
            const { durationMinutes, taskId, startTime, endTime } = req.body;
            const session = await this.service.recordSession(userId, { durationMinutes, taskId, startTime, endTime });
            res.status(201).json(session);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };

    summary = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user?.id as string;
            const days = req.query.days ? parseInt(String(req.query.days)) : 14;
            const data = await this.service.summary(userId, isNaN(days) ? 14 : days);
            res.status(200).json(data);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };
}

