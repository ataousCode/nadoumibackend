import storageService from "../utils/storage.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess } from "../utils/response.js";
import { ValidationError } from "../utils/errors.js";

class MediaController {
  /**
   * Generic upload for images/media.
   * Landed in memory via multer, then pushed to Cloudinary.
   */
  upload = asyncHandler(async (req, res) => {
    console.log('--- MEDIA UPLOAD INITIATED ---');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Body:', req.body);
    console.log('File:', req.file ? { name: req.file.originalname, size: req.file.size } : 'NONE');

    if (!req.file) {
      console.warn('Upload stopped: No file found in request');
      throw new ValidationError("No file provided");
    }

    const { folder = "nadoumi/assets" } = req.body;
    console.log('Target folder:', folder);

    const result = await storageService.upload(req.file.buffer, {
      folder,
      filename: req.file.originalname,
    });

    console.log('Upload success. Resource URL:', result.url);

    sendSuccess(res, {
      url: result.url,
      name: result.name,
      size: result.size,
      type: result.type,
      publicId: result.publicId,
    }, 201);
  });
}

export default new MediaController();
