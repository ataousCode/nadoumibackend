import adminService from "../services/admin.service.js";
import auditService from "../services/audit.service.js";
import storageService from "../utils/storage.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ValidationError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";
import { replaceUploadedFile } from "../utils/fileHelper.js";
import {
  extractBearerToken,
  setTokenCookie,
  clearTokenCookie,
} from "../utils/token.js";

class AdminController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await adminService.login(email, password, req.ip);

    await auditService.log({
      action: "ADMIN_LOGIN",
      resource: "Admin",
      resourceId: result.admin.id,
      adminId: result.admin.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Set httpOnly cookie — inaccessible to JavaScript (XSS protection)
    // Token is also returned in the body for backward compatibility with non-browser clients
    if (result.token) {
      setTokenCookie(res, result.token, "adminToken");
    }

    sendSuccess(res, result);
  });

  logout = asyncHandler(async (_req, res) => {
    clearTokenCookie(res, "adminToken");
    sendSuccess(res, { message: "Logged out successfully" });
  });

  verifyToken = asyncHandler(async (req, res) => {
    const token = extractBearerToken(req);
    const user = await adminService.verifyToken(token);
    sendSuccess(res, { user });
  });

  getProfile = asyncHandler(async (req, res) => {
    const profile = await adminService.getProfile(req.admin.id);
    sendSuccess(res, profile);
  });

  updateProfile = asyncHandler(async (req, res) => {
    const profile = await adminService.updateProfile(req.admin.id, req.body);
    sendSuccess(res, profile);
  });

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await adminService.changePassword(
      req.admin.id,
      currentPassword,
      newPassword,
    );
    sendSuccess(res, result);
  });

  updateProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError("No file provided");
    }

    // Upload to Aliyun OSS with optimization
    const uploadResult = await storageService.upload(req.file.buffer, {
      folder: "admin-profiles",
      filename: req.file.originalname,
      optimize: true,
    });

    // Update DB with the new OSS URL
    const result = await adminService.updateProfilePicture(
      req.admin.id,
      uploadResult.url,
      req.admin.profilePicture, // Still pass old URL to potentially clean up
    );

    // Cleanup old file from OSS if it was an OSS URL
    if (
      req.admin.profilePicture &&
      req.admin.profilePicture.includes("aliyuncs.com")
    ) {
      const oldPath = new URL(req.admin.profilePicture).pathname.substring(1);
      await storageService.delete(oldPath);
    }

    sendSuccess(res, { profilePicture: result.profilePicture });
  });

  getAuditFeed = asyncHandler(async (req, res) => {
    const logs = await auditService.getRecentLogs(req.query.limit);
    sendSuccess(res, logs);
  });

  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  });
}

export default new AdminController();
