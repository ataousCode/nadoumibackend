export const PASSWORD_MIN_LENGTH = 8;
export const BCRYPT_ROUNDS = 12;
export const JWT_EXPIRES_IN = "7d";
export const OTP_EXPIRATION_MINUTES = 10;
export const PASSWORD_RESET_EXPIRATION_HOURS = 1;


export const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export const FRONTEND_URL = process.env.FRONTEND_URL || "https://nadoumi.com";

export const PAGINATION_DEFAULT_PAGE = 1;

export const PAGINATION_DEFAULT_LIMIT = 12;


export const ROLES = {
  ADMIN: "admin",
  STUDENT: "student",
};

// Support Admins (Only these admins can be messaged by students)
export const SUPPORT_ADMIN_EMAILS = [
  "team@nadoumiconsulting.com",
  "almouslecka@gmail.com",
];

// University Statuses
export const UNIVERSITY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DRAFT: "draft",
};

// Scholarship Statuses
export const SCHOLARSHIP_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
  ACTIVE: "active",
  INACTIVE: "inactive",
};

// Application Statuses
export const APPLICATION_STATUS = {
  PENDING: "pending",
  RECEIVED: "received",
  UNDER_REVIEW: "under_review",
  INTERVIEW: "interview",
  INTERVIEW_PASSED: "interview_passed",
  INTERVIEW_FAILED: "interview_failed",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  REVOKED: "revoked",
  WAITLISTED: "waitlisted",
};

// Document Types
export const DOCUMENT_TYPES = {
  ADMISSION: "admission",
  PRE_ADMISSION: "pre-admission",
  JW202: "jw202",
};

// Upload Constants
export const IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;

// JWT Constants — JWT_SECRET MUST be set via env var in production
const jwtSecretFromEnv = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!jwtSecretFromEnv || jwtSecretFromEnv.length < 32)) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is missing or too short (min 32 chars). Server cannot start safely in production.",
  );
}
export const JWT_SECRET = jwtSecretFromEnv || "dev-only-insecure-secret-placeholder-for-local-testing";
export const JWT_EXPIRES_IN_VALUE =
  process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN;

// Email/SMTP Defaults
export const SMTP_DEFAULTS = {
  HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  PORT: parseInt(process.env.SMTP_PORT || "465"),
  FROM: process.env.EMAIL_FROM || "Nadoumi <noreply@nadoumi.com>",
  MAILDEV_HOST: process.env.MAILDEV_HOST || "localhost",
  MAILDEV_PORT: parseInt(process.env.MAILDEV_PORT || "1025"),
};

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR",
};
