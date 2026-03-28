import express from "express";
import documentController from "../controllers/document.controller.js";
import { authenticate } from "../middleware/auth.js";
import { createStudentDocumentUpload } from "../utils/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();
const upload = createStudentDocumentUpload();
const adminAuth = authenticate(ROLES.ADMIN);

const commonAuth = authenticate([ROLES.ADMIN, ROLES.STUDENT]);

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document upload and retrieval
 */

/**
 * @swagger
 * /api/documents/file/{path}:
 *   get:
 *     summary: Serve a file (Authenticated)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema: { type: string }
 *         description: Path to the file
 *     responses:
 *       200:
 *         description: The requested file
 */
router.get("/file/:path(*)", commonAuth, documentController.serveFile);

/**
 * @swagger
 * /api/documents/{applicationId}:
 *   post:
 *     summary: Upload a document for an application (Authenticated)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
router.post(
  "/:applicationId",
  commonAuth,
  upload.single("file"),
  documentController.upload,
);

/**
 * @swagger
 * /api/documents/{applicationId}:
 *   get:
 *     summary: Get all documents for an application (Admin only)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of documents for the application
 */
router.get("/:applicationId", adminAuth, documentController.getDocuments);

export default router;
