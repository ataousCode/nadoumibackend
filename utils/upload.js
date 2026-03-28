/**
 * upload.js — Multer configuration for all file uploads.
 *
 * We use memoryStorage so files land as req.file.buffer
 * and can be passed directly to Cloudinary (or any other cloud provider).
 * Nothing ever touches the local disk.
 */
import multer from "multer";
import {
  MAX_PROFILE_PICTURE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_VIDEO_SIZE,
  IMAGE_TYPES,
} from "../config/constants.js";

// All uploads go to memory (req.file.buffer), not disk
const memoryStorage = multer.memoryStorage();

// Validate that image files are actually images
const imageFilter = (_req, file, cb) => {
  if (IMAGE_TYPES.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (.jpg, .png, .gif, .webp)"));
  }
};

// Validate that application documents are safe types
const documentFilter = (_req, file, cb) => {
  const allowedTypes = /pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|jpeg|png|jpg/;
  if (allowedTypes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, Word documents, and images are allowed."));
  }
};

/** For student/admin profile picture uploads */
export const createProfilePictureUpload = () =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: MAX_PROFILE_PICTURE_SIZE },
    fileFilter: imageFilter,
  });

/** For application documents (PDFs, Word, etc.) */
export const createApplicationDocumentUpload = () =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: MAX_DOCUMENT_SIZE },
    fileFilter: documentFilter,
  });

/** For general student documents and larger files */
export const createStudentDocumentUpload = () =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: MAX_VIDEO_SIZE },
  });
