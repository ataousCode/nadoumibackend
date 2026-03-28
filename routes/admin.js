import express from "express";
import adminController from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";
import { strictLimiter } from "../middleware/rateLimiter.js";
import {
  loginAdminSchema,
  updateAdminProfileSchema,
  changeAdminPasswordSchema,
} from "../dto/admin.dto.js";
import { createProfilePictureUpload } from "../utils/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();
const profilePictureUpload = createProfilePictureUpload("admin");
const adminAuth = authenticate(ROLES.ADMIN);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management and oversight
 */

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin: { $ref: '#/components/schemas/Admin' }
 *                     token: { type: string }
 */
router.post(
  "/login",
  strictLimiter,
  validate(loginAdminSchema),
  adminController.login,
);

/**
 * @swagger
 * /api/admin/verify:
 *   get:
 *     summary: Verify admin token
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Token is valid
 */
router.get("/verify", adminController.verifyToken);

/**
 * @swagger
 * /api/admin/logout:
 *   delete:
 *     summary: Admin logout
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.delete("/logout", adminAuth, adminController.logout);

/**
 * @swagger
 * /api/admin/me:
 *   get:
 *     summary: Get admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Admin' }
 */
router.get("/me", adminAuth, adminController.getProfile);

/**
 * @swagger
 * /api/admin/me:
 *   put:
 *     summary: Update admin profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Admin'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  "/me",
  adminAuth,
  validate(updateAdminProfileSchema),
  adminController.updateProfile,
);

/**
 * @swagger
 * /api/admin/me/profile-picture:
 *   post:
 *     summary: Update admin profile picture
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated
 */
router.post(
  "/me/profile-picture",
  adminAuth,
  profilePictureUpload.single("profilePicture"),
  adminController.updateProfilePicture,
);

/**
 * @swagger
 * /api/admin/me/password:
 *   post:
 *     summary: Change admin password
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post(
  "/me/password",
  adminAuth,
  validate(changeAdminPasswordSchema),
  adminController.changePassword,
);

/**
 * @swagger
 * /api/admin/audit-feed:
 *   get:
 *     summary: Get admin audit feed
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Audit feed fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/AuditLog' }
 */
router.get("/audit-feed", adminAuth, adminController.getAuditFeed);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
 */
router.get("/stats", adminAuth, adminController.getDashboardStats);

export default router;
