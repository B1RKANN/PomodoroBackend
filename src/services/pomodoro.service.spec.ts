import { PomodoroService } from './pomodoro.service';
import { TaskService } from './task.service';

describe('PomodoroService', () => {
  const service = new PomodoroService();
  const taskService = new TaskService();

  it('records session and returns in summary', async () => {
    const userId = 'user-1';
    const task = await taskService.create(userId, { title: 'Focus Task' });

    // Today 25 min
    await service.recordSession(userId, { durationMinutes: 25, taskId: task._id.toString() });
    // Yesterday 50 min
    const now = new Date();
    const yesterdayEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStart = new Date(yesterdayEnd.getTime() - 50 * 60 * 1000);
    await service.recordSession(userId, { durationMinutes: 50, startTime: yesterdayStart, endTime: yesterdayEnd });

    // Complete one task today
    await taskService.complete(task._id.toString());

    const summary = await service.summary(userId, 7);
    expect(summary.totals.focusMinutes).toBe(75);
    expect(summary.today.focusMinutes).toBe(25);
    expect(summary.week.focusMinutes).toBeGreaterThanOrEqual(75);
    expect(summary.totals.completedTasks).toBe(1);
    expect(summary.today.completedTasks).toBe(1);
    expect(Array.isArray(summary.heatmap.cells)).toBe(true);
    expect(summary.heatmap.cells.length).toBeGreaterThan(0);
  });
});

