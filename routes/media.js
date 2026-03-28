import express from "express";
import mediaController from "../controllers/media.controller.js";
import { authenticate } from "../middleware/auth.js";
import { createProfilePictureUpload } from "../utils/upload.js"; // Reuse image filter
import { ROLES } from "../config/constants.js";

const router = express.Router();
const upload = createProfilePictureUpload(); // Provides image filtering and size limits
const adminAuth = authenticate(ROLES.ADMIN);

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Generic media upload for assets
 */

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Upload an image asset (Admin only)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 description: Target folder in Cloudinary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post(
  "/upload",
  adminAuth,
  upload.single("file"),
  mediaController.upload
);

export default router;
