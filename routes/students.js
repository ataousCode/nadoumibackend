import express from "express";
import studentController from "../controllers/student.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";
import { strictLimiter, standardLimiter } from "../middleware/rateLimiter.js";
import {
  registerStudentSchema,
  loginStudentSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../dto/student.dto.js";
import { createProfilePictureUpload } from "../utils/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();
const profilePictureUpload = createProfilePictureUpload("student");
const studentAuth = authenticate(ROLES.STUDENT);
const adminAuth = authenticate(ROLES.ADMIN);

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student authentication and profile management
 */

/**
 * @swagger
 * /api/students/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, country, passportNumber]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               country: { type: string }
 *               passportNumber: { type: string }
 *               phone: { type: string }
 *               dateOfBirth: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/register",
  standardLimiter,
  validate(registerStudentSchema),
  studentController.register,
);

/**
 * @swagger
 * /api/students/verify-email:
 *   post:
 *     summary: Verify student email with OTP
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, format: email }
 *               otp: { type: string }
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/verify-email",
  standardLimiter,
  validate(verifyOTPSchema),
  studentController.verifyEmail,
);

/**
 * @swagger
 * /api/students/resend-otp:
 *   post:
 *     summary: Resend verification OTP
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post(
  "/resend-otp",
  standardLimiter,
  validate(resendOTPSchema),
  studentController.resendOTP,
);

/**
 * @swagger
 * /api/students/login:
 *   post:
 *     summary: Student login
 *     tags: [Students]
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
 *                     student: { $ref: '#/components/schemas/Student' }
 *                     token: { type: string }
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  strictLimiter,
  validate(loginStudentSchema),
  studentController.login,
);

/**
 * @swagger
 * /api/students/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post(
  "/forgot-password",
  strictLimiter,
  validate(forgotPasswordSchema),
  studentController.forgotPassword,
);

/**
 * @swagger
 * /api/students/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post(
  "/reset-password",
  standardLimiter,
  validate(resetPasswordSchema),
  studentController.resetPassword,
);

/**
 * @swagger
 * /api/students/logout:
 *   delete:
 *     summary: Student logout
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.delete("/logout", studentAuth, studentController.logout);

/**
 * @swagger
 * /api/students/me:
 *   get:
 *     summary: Get current student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Student' }
 */
router.get("/me", studentAuth, studentController.getProfile);

/**
 * @swagger
 * /api/students/me:
 *   put:
 *     summary: Update student profile
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  "/me",
  studentAuth,
  validate(updateProfileSchema),
  studentController.updateProfile,
);

/**
 * @swagger
 * /api/students/me/password:
 *   post:
 *     summary: Change password
 *     tags: [Students]
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
  studentAuth,
  validate(changePasswordSchema),
  studentController.changePassword,
);

/**
 * @swagger
 * /api/students/me/profile-picture:
 *   post:
 *     summary: Update profile picture
 *     tags: [Students]
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
  studentAuth,
  profilePictureUpload.single("profilePicture"),
  studentController.updateProfilePicture,
);

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: List all students (Admin only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Student' }
 */
router.get("/", adminAuth, studentController.getAll);

export default router;
