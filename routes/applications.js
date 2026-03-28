import express from "express";
import applicationController from "../controllers/application.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";
import { strictLimiter, standardLimiter } from "../middleware/rateLimiter.js";
import {
  createApplicationSchema,
  publicCreateApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
  uploadAdminDocumentSchema,
} from "../dto/application.dto.js";
import { createApplicationDocumentUpload } from "../utils/upload.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();
const adminDocUpload = createApplicationDocumentUpload();
const adminAuth = authenticate(ROLES.ADMIN);
const studentAuth = authenticate(ROLES.STUDENT);

const sanitizeApplicationStatus = (req, res, next) => {
  if (req.body && req.body.status) {
    let status = req.body.status.toLowerCase();
    if (["interview_scheduled", "interviewscheduled"].includes(status))
      status = "interview";
    if (status === "interviewpassed") status = "interview_passed";
    if (status === "interview_failed" || status === "interviewfailed") {
      status = "rejected";
      if (req.body.metadata) {
        req.body.metadata.rejectionReason =
          req.body.metadata.rejectionReason || "interview_failed";
        req.body.metadata.rejectionFeedback =
          req.body.metadata.interviewFailureReason ||
          req.body.metadata.rejectionFeedback ||
          "Interview did not meet requirements";
      } else {
        req.body.metadata = {
          rejectionReason: "interview_failed",
          rejectionFeedback: "Interview did not meet requirements",
        };
      }
    }
    req.body.status = status;
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Scholarship application management
 */

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: List all applications (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: scholarshipId
 *         schema:
 *           type: string
 *         description: Filter by scholarship ID
 *     responses:
 *       200:
 *         description: List of applications
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", adminAuth, applicationController.getAll);

/**
 * @swagger
 * /api/applications/status/{status}:
 *   get:
 *     summary: List applications by status (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, received, under_review, interview, interview_passed, interview_failed, accepted, rejected, revoked, waitlisted]
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get("/status/:status", adminAuth, applicationController.getByStatus);

/**
 * @swagger
 * /api/applications/scholarship/{scholarshipId}:
 *   get:
 *     summary: List applications for a specific scholarship (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scholarshipId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get(
  "/scholarship/:scholarshipId",
  adminAuth,
  applicationController.getByScholarship,
);

/**
 * @swagger
 * /api/applications/search/{term}:
 *   get:
 *     summary: Search applications (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: term
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search/:term", adminAuth, applicationController.search);

/**
 * @swagger
 * /api/applications/student/me:
 *   get:
 *     summary: Get current student's applications
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student's applications
 */
router.get(
  "/student/me",
  studentAuth,
  applicationController.getStudentApplications,
);

/**
 * @swagger
 * /api/applications/student/me/{id}:
 *   get:
 *     summary: Get specific application details for current student
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Application details
 */
router.get(
  "/student/me/:id",
  studentAuth,
  applicationController.getStudentApplicationById,
);

/**
 * @swagger
 * /api/applications/student/me:
 *   post:
 *     summary: Submit a new application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application_json:
 *           schema:
 *             type: object
 *             required: [scholarshipId]
 *             properties:
 *               scholarshipId:
 *                 type: string
 *               preferences:
 *                 type: object
 *               documents:
 *                 type: object
 *     responses:
 *       201:
 *         description: Application created
 *       400:
 *         description: Validation error or duplicate application
 */
router.post(
  "/student/me",
  studentAuth,
  standardLimiter,
  validate(createApplicationSchema),
  applicationController.createApplication,
);

/**
 * @swagger
 * /api/applications/student/me/{id}:
 *   put:
 *     summary: Update application details (Student)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences: { type: object }
 *               documents: { type: object }
 *     responses:
 *       200:
 *         description: Application updated
 */
router.put(
  "/student/me/:id",
  studentAuth,
  validate(updateApplicationSchema),
  applicationController.updateApplication,
);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get application by ID (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Application details
 */
router.get("/:id", adminAuth, applicationController.getById);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   put:
 *     summary: Update application status (Admin only)
 *     tags: [Applications]
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
 *         application_json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put(
  "/:id/status",
  adminAuth,
  sanitizeApplicationStatus,
  validate(updateApplicationStatusSchema),
  applicationController.updateStatus,
);

/**
 * @swagger
 * /api/applications/{id}/admin-documents:
 *   put:
 *     summary: Upload admin documents (Admission letter, JW202)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documentType: { type: string, enum: [admission, jw202] }
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Document uploaded
 */
router.put(
  "/:id/admin-documents",
  adminAuth,
  adminDocUpload.single("file"),
  validate(uploadAdminDocumentSchema),
  applicationController.uploadAdminDocument,
);

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Delete application (Admin only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Application deleted
 */
router.delete("/:id", adminAuth, applicationController.delete);

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Public inquiry / Quick inquiry form
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [applicant]
 *             properties:
 *               applicant:
 *                 type: object
 *                 properties:
 *                   firstName: { type: string }
 *                   lastName: { type: string }
 *                   email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Inquiry received
 */
router.post(
  "/",
  standardLimiter,
  validate(publicCreateApplicationSchema),
  applicationController.create,
);

export default router;
