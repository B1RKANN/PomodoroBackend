import { TaskService } from './task.service';

describe('TaskService', () => {
  const service = new TaskService();

  it('creates and completes a task', async () => {
    const task = await service.create('user-1', { title: 'Test Task' });
    expect(task.title).toBe('Test Task');
    expect(task.isCompleted).toBe(false);

    const completed = await service.complete(task._id.toString());
    expect(completed?.isCompleted).toBe(true);
    expect(completed?.completedAt).toBeDefined();
  });

  it('soft deletes a task', async () => {
    const t = await service.create('user-1', { title: 'To Delete' });
    const softDeleted = await service.delete(t._id.toString(), true);
    // @ts-ignore
    expect(softDeleted?.deletedAt).toBeTruthy();
  });
});

