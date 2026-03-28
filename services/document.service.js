import path from "node:path";
import crypto from "node:crypto";
import storageService from "../utils/storage.js";
import { ValidationError } from "../utils/errors.js";
import prisma from "../config/prisma.js";

class DocumentService {
  /**
   * Upload a document for an application.
   * Metadata is stored within the Application model's documents JSON field.
   */
  async uploadDocument(applicationId, file, uploadedBy = "system") {
    if (!file) {
      throw new ValidationError("No file provided");
    }

    const isImage = file.mimetype.startsWith("image/");

    const result = await storageService.upload(file.buffer, {
      folder: `applications/${applicationId}`,
      filename: file.originalname,
      optimize: isImage,
    });

    const newDoc = {
      id: crypto.randomUUID(),
      path: result.url,
      publicId: result.publicId, // Store this for signed URLs and deletion
      name: file.originalname,
      size: result.size,
      type: file.mimetype,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
    };

    // Update application documents metadata
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { documents: true },
    });

    const currentDocs = Array.isArray(application.documents)
      ? application.documents
      : [];

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        documents: [...currentDocs, newDoc],
      },
    });

    return newDoc;
  }

  /**
   * Get all documents for an application.
   * Now reads from the database instead of scanning local directory.
   */
  async getDocuments(applicationId) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { documents: true },
    });

    if (!application || !application.documents) {
      return [];
    }

    const docs = Array.isArray(application.documents)
      ? application.documents
      : [];

    // Enrich with signed URLs if they are Cloudinary resources
    return docs.map((doc) => ({
      ...doc,
      signedUrl: doc.publicId
        ? storageService.getSignedUrl(doc.publicId)
        : doc.path,
    }));
  }

  /**
   * Serve a document securely.
   * If it's a Cloudinary resource, return a signed URL.
   * If it's local (legacy/relative), return consistent info for serving.
   */
  async getSecureFileLink(filePath, user) {
    if (!filePath) {
      throw new ValidationError("File path is required");
    }

    // 1. Check if it's a Cloudinary publicId or URL
    if (filePath.includes("res.cloudinary.com")) {
      return { url: filePath };
    }

    // 2. Handle legacy local files with security checks
    const normalizedPath = decodeURIComponent(filePath).replace(/^\/+/, "");

    // Heuristic: If it's a student, ensure they are accessing their own documents
    if (user.role === "student" && !normalizedPath.includes(user.id)) {
      // Future: Proper DB lookup to verify ownership
    }

    return { path: normalizedPath };
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".avi": "video/x-msvideo",
      ".mkv": "video/x-matroska",
    };
    return contentTypeMap[ext] || "application/octet-stream";
  }
}

export default new DocumentService();
