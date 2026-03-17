import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Server health check endpoints
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check whether the server is running
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12.34
 */
router.get('/', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

export default router;
