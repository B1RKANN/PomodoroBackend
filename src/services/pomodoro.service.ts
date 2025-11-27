import { PomodoroRepository } from '../repositories/pomodoro.repository';
import { TaskRepository } from '../repositories/task.repository';
import { IPomodoroSession } from '../models/pomodoroSession.model';

function startOfDay(date: Date) { const d = new Date(date); d.setHours(0,0,0,0); return d; }
function endOfDay(date: Date) { const d = new Date(date); d.setHours(23,59,59,999); return d; }
function startOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // make Monday start
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
}
function endOfWeek(date: Date) { const s = startOfWeek(date); const e = new Date(s); e.setDate(e.getDate()+6); e.setHours(23,59,59,999); return e; }

export class PomodoroService {
    private repo: PomodoroRepository;
    private taskRepo: TaskRepository;

    constructor() {
        this.repo = new PomodoroRepository();
        this.taskRepo = new TaskRepository();
    }

    async recordSession(userId: string, input: { durationMinutes: number; taskId?: string; startTime?: Date; endTime?: Date }): Promise<IPomodoroSession> {
        const end = input.endTime ? new Date(input.endTime) : new Date();
        const start = input.startTime ? new Date(input.startTime) : new Date(end.getTime() - input.durationMinutes * 60_000);
        return await this.repo.create({ userId, taskId: input.taskId, startTime: start, endTime: end, durationMinutes: input.durationMinutes });
    }

    async summary(userId: string, days = 14) {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        const rangeStart = new Date(now);
        rangeStart.setDate(rangeStart.getDate() - (days - 1));
        rangeStart.setHours(0,0,0,0);
        const rangeEnd = todayEnd;

        const totalFocus = await this.repo.sumDurationByUser(userId);
        const weekFocus = await this.repo.sumDurationByUser(userId, weekStart, weekEnd);
        const todayFocus = await this.repo.sumDurationByUser(userId, todayStart, todayEnd);

        const totalCompleted = await this.taskRepo.countCompletedByUser(userId);
        const weekCompleted = await this.taskRepo.countCompletedByUser(userId, weekStart, weekEnd);
        const todayCompleted = await this.taskRepo.countCompletedByUser(userId, todayStart, todayEnd);

        const sessions = await this.repo.findByUserInRange(userId, rangeStart, rangeEnd);
        const heatmapCells = sessions.map(s => ({
            date: s.startTime.toISOString().slice(0,10),
            hour: s.startTime.getHours(),
            minutes: s.durationMinutes
        }));

        return {
            totals: { focusMinutes: totalFocus, completedTasks: totalCompleted },
            week: { focusMinutes: weekFocus, completedTasks: weekCompleted, startDate: weekStart, endDate: weekEnd },
            today: { focusMinutes: todayFocus, completedTasks: todayCompleted, date: todayStart },
            heatmap: { startDate: rangeStart, endDate: rangeEnd, cells: heatmapCells }
        };
    }
}

