import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';

export interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
        nickname?: string; // Optional, can be fetched from DB if needed, or passed in token
    };
}

export const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: Token required'));
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
        socket.data.userId = decoded.id;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
};
