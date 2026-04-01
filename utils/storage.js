import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import path from "node:path";
import logger from "./logger.js";

// Configure Cloudinary once on module load
console.log('[STORAGE] Initializing Cloudinary service...');
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
  console.warn('[STORAGE] CRITICAL: Cloudinary credentials missing from process.env');
} else {
  console.log(`[STORAGE] Cloudinary configured for name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs
});

// Supported image MIME types for auto-optimization
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

/**
 * Format a byte count into a human-readable string (e.g. "1.4 MB")
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

class StorageService {
  /**
   * Upload a file buffer to Cloudinary.
   *
   * @param {Buffer} fileBuffer - Raw file buffer from multer
   * @param {object} options
   * @param {string} options.folder  - Logical folder, e.g. 'messages/conv-id'
   * @param {string} options.filename - Original filename from the user
   * @returns {{ url: string, name: string, size: string, type: 'image'|'file' }}
   */
  async upload(fileBuffer, { folder = "nadoumi", filename = "file" }) {
    const ext = path.extname(filename).toLowerCase();
    const isImage = IMAGE_EXTENSIONS.has(ext);

    // Unique public_id — no extension suffix needed for images (Cloudinary handles it)
    const publicId = `${folder}/${randomUUID()}`;

    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            folder: "nadoumi", // top-level Cloudinary folder
            resource_type: isImage ? "image" : "raw", // 'raw' = any non-media file
            // Auto-optimize images
            ...(isImage && {
              transformation: [
                { quality: "auto", fetch_format: "auto" },
                { width: 1200, height: 1200, crop: "limit" }, // cap dimensions, never upscale
              ],
            }),
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(fileBuffer);
      });

      const uploadedSize = formatBytes(result.bytes);
      const type = isImage ? "image" : "file";

      logger.info("File uploaded to Cloudinary", {
        url: result.secure_url,
        type,
        size: uploadedSize,
      });

      return {
        url: result.secure_url,    // CDN URL, always HTTPS
        name: filename,            // Original filename (e.g. "passport.pdf")
        size: uploadedSize,        // Human-readable (e.g. "1.4 MB")
        type,                      // 'image' or 'file'
        publicId: result.public_id, // For future deletion
      };
    } catch (error) {
      console.error('[STORAGE] FULL ERROR OBJECT:', JSON.stringify(error, null, 2));
      logger.error("Cloudinary upload failed", { error: error.message, filename });
      throw new Error(`Cloudinary Error: ${error.message}`);
    }
  }

  /**
   * Delete a file from Cloudinary by its public_id.
   *
   * @param {string} publicId - The public_id returned from upload()
   * @param {'image'|'raw'} resourceType
   */
  async delete(publicId, resourceType = "image") {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      logger.info("File deleted from Cloudinary", { publicId });
    } catch (error) {
      logger.error("Cloudinary delete failed", { error: error.message, publicId });
    }
  }

  /**
   * Generate a signed URL for a private Cloudinary resource.
   * (Only needed if you set resources to private/authenticated.)
   *
   * @param {string} publicId
   * @param {number} expiresInSeconds
   */
  getSignedUrl(publicId, expiresInSeconds = 3600) {
    try {
      return cloudinary.url(publicId, {
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
        secure: true,
      });
    } catch (error) {
      logger.error("Cloudinary signed URL failed", { error: error.message });
      return null;
    }
  }
}

export default new StorageService();
