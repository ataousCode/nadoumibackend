import adminService from "../services/admin.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ValidationError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";
import { replaceUploadedFile } from "../utils/fileHelper.js";
import { extractBearerToken, setTokenCookie, clearTokenCookie } from "../utils/token.js";

class AdminController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await adminService.login(email, password);

    // Set httpOnly cookie — inaccessible to JavaScript (XSS protection)
    // Token is also returned in the body for backward compatibility with non-browser clients
    if (result.token) {
      setTokenCookie(res, result.token, 'adminToken')
    }

    sendSuccess(res, result);
  });

  logout = asyncHandler(async (_req, res) => {
    clearTokenCookie(res, 'adminToken')
    sendSuccess(res, { message: 'Logged out successfully' })
  })

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
      newPassword
    );
    sendSuccess(res, result);
  });

  updateProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError("No file provided");
    }

    const newFilePath = await replaceUploadedFile(
      req.admin.profilePicture,
      req.file.filename,
      "profile-pictures/admins"
    );

    const result = await adminService.updateProfilePicture(
      req.admin.id,
      newFilePath,
      req.admin.profilePicture
    );

    sendSuccess(res, { profilePicture: result.profilePicture });
  });
}

export default new AdminController();
