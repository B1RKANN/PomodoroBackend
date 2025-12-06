import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';

const router = Router();
const controller = new RoomController();

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Odalar
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RoomInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [SHARED_POMODORO, INDIVIDUAL_POMODORO]
 *         isPassword:
 *           type: boolean
 */

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Tüm odaları döndürür (name, type, isPassword)
 *     tags: [Rooms]
 *     security: []
 *     responses:
 *       200:
 *         description: Oda listesi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RoomInfo'
 */
router.get('/', controller.list);

export default router;
