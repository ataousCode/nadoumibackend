import messageService from "../services/message.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess } from "../utils/response.js";
import storageService from "../utils/storage.js";
import prisma from "../config/prisma.js";

class MessageController {
  getConversations = asyncHandler(async (req, res) => {
    const studentId = req.student?.id;
    const adminId = req.admin?.id;

    if (studentId) {
      const conversations = await messageService.getStudentConversations(studentId);
      return sendSuccess(res, conversations);
    }
    
    if (adminId) {
      const conversations = await messageService.getAdminConversations(adminId);
      return sendSuccess(res, conversations);
    }

    sendSuccess(res, []);
  });

  getSupportAdmins = asyncHandler(async (req, res) => {
    console.log(`[DIAGNOSTIC] Support admins requested by ${req.user?.email || 'Unknown'}`);
    
    // Direct Database Count Test
    const rawAdminCount = await prisma.admin.count();
    console.log(`[DIAGNOSTIC] RAW DATABASE COUNT: Found ${rawAdminCount} administrators in the Admin table.`);

    const admins = await messageService.getSupportAdmins();
    console.log(`[DIAGNOSTIC] SERVICE RESULT: Found ${admins?.length || 0} administrators via service layer.`);

    sendSuccess(res, admins || []);
  });

  getMessages = asyncHandler(async (req, res) => {
    const studentId = req.student?.id;
    const adminId = req.admin?.id;
    const { conversationId } = req.params;

    if (studentId) {
      const messages = await messageService.getConversationMessages(studentId, conversationId);
      return sendSuccess(res, messages);
    }

    if (adminId) {
      const messages = await messageService.getConversationMessagesByAdmin(adminId, conversationId);
      return sendSuccess(res, messages);
    }

    res.status(403).json({ message: "Unauthorized" });
  });

  sendMessage = asyncHandler(async (req, res) => {
    const studentId = req.student?.id;
    const adminId = req.admin?.id;
    const { conversationId, adminId: targetAdminId, content, type, fileInfo } = req.body;

    if (studentId) {
      const message = await messageService.sendMessage(studentId, "student", {
        conversationId,
        adminId: targetAdminId,
        content,
        type,
        fileInfo
      });
      return sendSuccess(res, message);
    }

    if (adminId) {
      const message = await messageService.sendMessage(adminId, "admin", {
        conversationId,
        content,
        type,
        fileInfo
      });
      return sendSuccess(res, message);
    }

    res.status(403).json({ message: "Unauthorized" });
  });

  createConversation = asyncHandler(async (req, res) => {
    const studentId = req.student?.id;
    const { adminId } = req.body;

    if (!studentId) {
      return res.status(403).json({ message: "Only students can create conversations via this portal" });
    }

    const conversation = await messageService.getOrCreateConversation(studentId, adminId);
    sendSuccess(res, conversation);
  });

  uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { conversationId } = req.params;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    
    // Detect type from MIME type
    const isImage = mimeType.startsWith('image/');

    // Upload to storage
    const result = await storageService.upload(req.file.buffer, {
      folder: `messages/${conversationId}`,
      filename: originalName,
      optimize: isImage, // Optimize only images
    });

    // Return structured metadata
    sendSuccess(res, {
      url: result.url,
      name: originalName,   // Always the original filename, NOT the OSS key
      size: result.size,    // Human-readable size from storage service
      type: isImage ? 'image' : 'file', // Crisp type: 'image' or 'file'
      mimeType,
    });
  });
}

export default new MessageController();
