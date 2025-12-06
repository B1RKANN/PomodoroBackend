import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import pomodoroRoutes from './routes/pomodoro.routes';
import roomRoutes from './routes/room.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import http from 'http';
import { Server } from 'socket.io';
import { initializeSocket } from './socket/socket.service';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Initialize Socket Service
initializeSocket(io);

server.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
    console.log(`Swagger docs available at http://localhost:${config.port}/api-docs`);
});
