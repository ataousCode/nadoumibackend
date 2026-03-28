import express from "express";
import programController from "../controllers/program.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Programs
 *   description: Scholarship programs and majors
 */

/**
 * @swagger
 * /api/programs:
 *   get:
 *     summary: Get all scholarship programs
 *     tags: [Programs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: teachingLanguage
 *         schema: { type: string }
 *       - in: query
 *         name: field
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of programs
 */
router.get("/", programController.getAll);

/**
 * @swagger
 * /api/programs/featured:
 *   get:
 *     summary: Get featured scholarship programs
 *     tags: [Programs]
 *     responses:
 *       200:
 *         description: List of featured programs
 */
router.get("/featured", programController.getFeatured);

/**
 * @swagger
 * /api/programs/categories:
 *   get:
 *     summary: Get all distinct program categories
 *     tags: [Programs]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get("/categories", programController.getCategories);

/**
 * @swagger
 * /api/programs/{id}:
 *   get:
 *     summary: Get program by ID
 *     tags: [Programs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Program details
 */
router.get("/:id", programController.getById);

export default router;
