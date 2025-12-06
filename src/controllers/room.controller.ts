import { Request, Response } from 'express';
import Room from '../models/room.model';

export class RoomController {
    list = async (_req: Request, res: Response) => {
        try {
            const rooms = await Room.find().select('name type password -_id').lean();
            const payload = rooms.map(r => ({ name: r.name, type: r.type, isPassword: Boolean((r as any).password) }));
            res.status(200).json(payload);
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    };
}

