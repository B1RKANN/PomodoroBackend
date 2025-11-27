import { Router } from 'express';
import { PomodoroController } from '../controllers/pomodoro.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const controller = new PomodoroController();

/**
 * @swagger
 * tags:
 *   name: Pomodoro
 *   description: Pomodoro oturumları ve özetleri
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PomodoroSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         taskId:
 *           type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         durationMinutes:
 *           type: number
 */

/**
 * @swagger
 * /api/pomodoro/sessions:
 *   post:
 *     summary: Pomodoro kaydı oluşturma
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - durationMinutes
 *             properties:
 *               durationMinutes:
 *                 type: number
 *               taskId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Oluşturulan kayıt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PomodoroSession'
 */
router.post('/sessions', requireAuth, controller.record);

/**
 * @swagger
 * /api/pomodoro/summary:
 *   get:
 *     summary: Görsele benzer özet verileri döndürür
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Heatmap için gün sayısı (varsayılan 14)
 *     responses:
 *       200:
 *         description: Özet veri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totals:
 *                   type: object
 *                   properties:
 *                     focusMinutes:
 *                       type: number
 *                     completedTasks:
 *                       type: number
 *                 week:
 *                   type: object
 *                   properties:
 *                     focusMinutes:
 *                       type: number
 *                     completedTasks:
 *                       type: number
 *                 today:
 *                   type: object
 *                   properties:
 *                     focusMinutes:
 *                       type: number
 *                     completedTasks:
 *                       type: number
 *                 heatmap:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     cells:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           hour:
 *                             type: integer
 *                           minutes:
 *                             type: number
 */
router.get('/summary', requireAuth, controller.summary);

export default router;

