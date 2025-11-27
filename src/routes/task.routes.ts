import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const controller = new TaskController();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Görev yönetimi
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         isCompleted:
 *           type: boolean
 *         completedAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Görev oluşturma
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Oluşturulan görev
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 */
router.post('/', requireAuth, controller.create);

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   patch:
 *     summary: Görevi tamamlama
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Güncellenen görev
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Bulunamadı
 */
router.patch('/:id/complete', requireAuth, controller.complete);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Görev silme (soft delete varsayılan)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: true ise soft delete, false ise hard delete
 *     responses:
 *       200:
 *         description: Soft delete sonucu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       204:
 *         description: Hard delete yapıldı
 */
router.delete('/:id', requireAuth, controller.delete);

export default router;

