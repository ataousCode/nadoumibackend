import express from "express";
import scholarshipController from "../controllers/scholarship.controller.js";
import { authenticate, identifyAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";
import {
  createScholarshipSchema,
  updateScholarshipSchema,
  updateScholarshipStatusSchema,
} from "../dto/scholarship.dto.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();
const adminAuth = authenticate(ROLES.ADMIN);

/**
 * @swagger
 * tags:
 *   name: Scholarships
 *   description: Scholarship management and exploration
 */

/**
 * @swagger
 * /api/scholarships:
 *   get:
 *     summary: Get all scholarships
 *     tags: [Scholarships]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: programCategory
 *         schema:
 *           type: string
 *         description: Filter by program category (Bachelor, Master, PhD, Language)
 *     responses:
 *       200:
 *         description: List of scholarships
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     scholarships:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Scholarship'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         pages: { type: integer }
 *                         page: { type: integer }
 *                         limit: { type: integer }
 */
router.get("/", identifyAdmin, scholarshipController.getAll);

/**
 * @swagger
 * /api/scholarships/featured:
 *   get:
 *     summary: Get featured scholarships
 *     tags: [Scholarships]
 *     responses:
 *       200:
 *         description: List of featured scholarships
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Scholarship'
 */
router.get("/featured", scholarshipController.getFeatured);

/**
 * @swagger
 * /api/scholarships/{id}:
 *   get:
 *     summary: Get scholarship by ID
 *     tags: [Scholarships]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scholarship ID (UUID or custom ID)
 *     responses:
 *       200:
 *         description: Scholarship details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Scholarship'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id", scholarshipController.getById);

/**
 * @swagger
 * /api/scholarships:
 *   post:
 *     summary: Create a new scholarship (Admin only)
 *     tags: [Scholarships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               universityId: { type: string, format: uuid }
 *               programCategory: { type: string, enum: [Language, Bachelor, Master, PhD] }
 *               scholarshipCategory: { type: string }
 *               applicationDeadline: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Scholarship created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  adminAuth,
  scholarshipController.create,
);

/**
 * @swagger
 * /api/scholarships/{id}:
 *   put:
 *     summary: Update scholarship (Admin only)
 *     tags: [Scholarships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Scholarship'
 *     responses:
 *       200:
 *         description: Scholarship updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  "/:id",
  adminAuth,
  scholarshipController.update,
);

/**
 * @swagger
 * /api/scholarships/{id}:
 *   delete:
 *     summary: Delete scholarship (Admin only)
 *     tags: [Scholarships]
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
 *         description: Scholarship deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete("/:id", adminAuth, scholarshipController.delete);

/**
 * @swagger
 * /api/scholarships/{id}/status:
 *   patch:
 *     summary: Update scholarship status (Admin only)
 *     tags: [Scholarships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [draft, published, closed, active, inactive] }
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch(
  "/:id/status",
  adminAuth,
  validate(updateScholarshipStatusSchema),
  scholarshipController.updateStatus,
);

export default router;
