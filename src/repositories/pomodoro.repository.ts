import PomodoroSession, { IPomodoroSession } from '../models/pomodoroSession.model';

export class PomodoroRepository {
    async create(data: Partial<IPomodoroSession>): Promise<IPomodoroSession> {
        const session = new PomodoroSession(data);
        return await session.save();
    }

    async findByUserInRange(userId: string, start: Date, end: Date): Promise<IPomodoroSession[]> {
        return await PomodoroSession.find({ userId, startTime: { $gte: start }, endTime: { $lte: end } }).sort({ startTime: 1 });
    }

    async sumDurationByUser(userId: string, start?: Date, end?: Date): Promise<number> {
        const match: any = { userId };
        if (start || end) {
            match.startTime = {};
            if (start) match.startTime.$gte = start;
            if (end) match.startTime.$lte = end;
        }
        const result = await PomodoroSession.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$durationMinutes' } } }
        ]);
        return result.length ? result[0].total : 0;
    }
}

