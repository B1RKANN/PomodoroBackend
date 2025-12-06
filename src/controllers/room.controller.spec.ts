import { RoomController } from './room.controller';
import Room, { RoomType } from '../models/room.model';

describe('RoomController', () => {
  const controller = new RoomController();

  it('listeleme: name, type ve isPassword döner; password dönmez', async () => {
    await Room.create({ name: 'room-a', type: RoomType.SHARED_POMODORO, password: 'secret', hostUserId: 'u1', participants: [] });
    await Room.create({ name: 'room-b', type: RoomType.INDIVIDUAL_POMODORO, password: 'top', hostUserId: 'u2', participants: [] });
    await Room.create({ name: 'room-c', type: RoomType.SHARED_POMODORO, hostUserId: 'u3', participants: [] });

    const res: any = {
      statusCode: 0,
      payload: undefined as any,
      status(code: number) { this.statusCode = code; return this; },
      json(data: any) { this.payload = data; }
    };

    await controller.list({} as any, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.payload)).toBe(true);
    expect(res.payload.length).toBe(3);
    for (const r of res.payload) {
      expect(Object.keys(r)).toEqual(expect.arrayContaining(['name', 'type', 'isPassword']));
      expect(r.name).toMatch(/^room-/);
      expect(['SHARED_POMODORO', 'INDIVIDUAL_POMODORO']).toContain(r.type);
      expect('password' in r).toBe(false);
      expect('_id' in r).toBe(false);
      if (r.name === 'room-c') {
        expect(r.isPassword).toBe(false);
      } else {
        expect(r.isPassword).toBe(true);
      }
    }
  });
});
