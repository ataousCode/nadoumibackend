import express from "express";
import universityController from "../controllers/university.controller.js";
import { authenticate, identifyAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();
const adminAuth = authenticate(ROLES.ADMIN);

/**
 * @swagger
 * tags:
 *   name: Universities
 *   description: University management
 */

/**
 * @swagger
 * /api/universities:
 *   get:
 *     summary: Get all universities
 *     tags: [Universities]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, draft] }
 *     responses:
 *       200:
 *         description: List of universities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/University' }
 */
router.get("/", identifyAdmin, universityController.getAll);

/**
 * @swagger
 * /api/universities/{id}:
 *   get:
 *     summary: Get university by ID
 *     tags: [Universities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: University details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/University' }
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id", universityController.getById);

/**
 * @swagger
 * /api/universities:
 *   post:
 *     summary: Create a new university (Admin only)
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/University'
 *     responses:
 *       201:
 *         description: University created
 */
router.post("/", adminAuth, universityController.create);

/**
 * @swagger
 * /api/universities/{id}:
 *   put:
 *     summary: Update university (Admin only)
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/University'
 *     responses:
 *       200:
 *         description: University updated
 */
router.put("/:id", adminAuth, universityController.update);

/**
 * @swagger
 * /api/universities/{id}:
 *   delete:
 *     summary: Delete university (Admin only)
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: University deleted
 */
router.delete("/:id", adminAuth, universityController.delete);

/**
 * @swagger
 * /api/universities/{id}/status:
 *   patch:
 *     summary: Update university status (Admin only)
 *     tags: [Universities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, inactive, draft] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", adminAuth, universityController.updateStatus);

export default router;
