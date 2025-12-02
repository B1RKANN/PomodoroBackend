import { PomodoroRepository } from '../repositories/pomodoro.repository';
import { TaskRepository } from '../repositories/task.repository';
import { IPomodoroSession } from '../models/pomodoroSession.model';

function fmtIstanbul(date: Date) {
    const s = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hourCycle: 'h24'
    }).format(date);
    const [ymd, hms] = s.split(' ');
    return `${ymd}T${hms}+03:00`;
}

function istanbulYmd(date: Date) {
    const s = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    return s;
}

function istanbulHour(date: Date) {
    const s = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul', hour: '2-digit', hourCycle: 'h24' }).format(date);
    return parseInt(s, 10);
}

function istanbulStartOfDay(date: Date) {
    const ymd = istanbulYmd(date);
    return new Date(`${ymd}T00:00:00+03:00`);
}

function istanbulEndOfDay(date: Date) {
    const ymd = istanbulYmd(date);
    return new Date(`${ymd}T23:59:59.999+03:00`);
}

export class PomodoroService {
    private repo: PomodoroRepository;
    private taskRepo: TaskRepository;

    constructor() {
        this.repo = new PomodoroRepository();
        this.taskRepo = new TaskRepository();
    }

    async recordSession(userId: string, input: { durationMinutes: number; taskId?: string; startTime?: Date; endTime?: Date }): Promise<IPomodoroSession> {
        const now = new Date();
        const end = input.endTime ? new Date(input.endTime) : now;
        const start = input.startTime ? new Date(input.startTime) : new Date(end.getTime() - input.durationMinutes * 60_000);
        return await this.repo.create({ userId, taskId: input.taskId, startTime: start, endTime: end, durationMinutes: input.durationMinutes });
    }

    async summary(userId: string, days = 14) {
        const now = new Date();
        const todayStart = istanbulStartOfDay(now);
        const todayEnd = istanbulEndOfDay(now);
        const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
        const weekEnd = todayEnd;
        const rangeStart = new Date(istanbulStartOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)));
        const rangeEnd = todayEnd;

        const totalFocus = await this.repo.sumDurationByUser(userId);
        const weekFocus = await this.repo.sumDurationByUser(userId, weekStart, weekEnd);
        const todayFocus = await this.repo.sumDurationByUser(userId, todayStart, todayEnd);

        const totalCompleted = await this.taskRepo.countCompletedByUser(userId);
        const weekCompleted = await this.taskRepo.countCompletedByUser(userId, weekStart, weekEnd);
        const todayCompleted = await this.taskRepo.countCompletedByUser(userId, todayStart, todayEnd);

        const sessions = await this.repo.findByUserInRange(userId, rangeStart, rangeEnd);
        const heatmapCells = sessions.map(s => ({
            date: istanbulYmd(s.startTime),
            hour: istanbulHour(s.startTime),
            minutes: s.durationMinutes
        }));

        return {
            totals: { focusMinutes: totalFocus, completedTasks: totalCompleted },
            week: { focusMinutes: weekFocus, completedTasks: weekCompleted, startDate: fmtIstanbul(weekStart), endDate: fmtIstanbul(weekEnd) },
            today: { focusMinutes: todayFocus, completedTasks: todayCompleted, date: fmtIstanbul(todayStart) },
            heatmap: { startDate: fmtIstanbul(rangeStart), endDate: fmtIstanbul(rangeEnd), cells: heatmapCells },
            sessions: sessions.map(s => ({ startTime: fmtIstanbul(s.startTime), endTime: fmtIstanbul(s.endTime), durationMinutes: s.durationMinutes }))
        };
    }
}
