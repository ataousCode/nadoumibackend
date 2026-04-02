import BaseService from "./base.service.js";
import conversationRepository from "../repositories/conversation.repository.js";
import messageRepository from "../repositories/message.repository.js";
import adminRepository from "../repositories/admin.repository.js";
import { NotFoundError } from "../utils/errors.js";

class MessageService extends BaseService {
  constructor() {
    super(messageRepository, "Message");
  }

  async getSupportAdmins() {
    return await adminRepository.findAllForSupport();
  }

  async getAdminConversations(adminId) {
    return await conversationRepository.findByAdminId(adminId);
  }

  async getStudentConversations(studentId) {
    return await conversationRepository.findByStudentId(studentId);
  }

  async getConversationMessages(studentId, conversationId) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");
    
    if (conversation.studentId !== studentId) {
      throw new Error("Unauthorized to access this conversation");
    }
    
    // Reset Student-specific unread count and mark messages as read
    await conversationRepository.resetUnreadCountStudent(conversationId);
    await messageRepository.markAsRead(conversationId, studentId);
    
    // Broadcast read status
    this._broadcastReadStatus(conversationId, conversation.adminId);
    
    return await messageRepository.findByConversationId(conversationId);
  }

  async getConversationMessagesByAdmin(adminId, conversationId) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw new NotFoundError("Conversation not found");
    
    if (conversation.adminId !== adminId) {
      throw new Error("Unauthorized to access this conversation");
    }

    // Reset Admin-specific unread count and mark messages as read
    await conversationRepository.resetUnreadCountAdmin(conversationId);
    await messageRepository.markAsRead(conversationId, adminId);

    // Broadcast read status
    this._broadcastReadStatus(conversationId, conversation.studentId);
    
    return await messageRepository.findByConversationId(conversationId);
  }

  _broadcastReadStatus(conversationId, recipientId) {
    try {
      const io = process.app?.get?.("io");
      if (io) {
        io.to(`conversation:${conversationId}`).emit("messages:read", { conversationId });
        // Also notify user to refresh their sidebar unread counts
        io.to(`user:${recipientId}`).emit("conversations:refresh");
      }
    } catch (err) {
      console.error("Read status broadcast failed:", err);
    }
  }

  async getOrCreateConversation(studentId, adminId) {
    // Validate adminId exists
    const admin = await adminRepository.findByIdWithoutPassword(adminId);
    if (!admin) {
        throw new Error("Invalid Administrator selected");
    }
    return await conversationRepository.findOrCreate(studentId, adminId);
  }

  async sendMessage(senderId, senderRole, { conversationId, adminId, content, type, fileInfo }) {
    let conversation;
    
    if (conversationId) {
      conversation = await conversationRepository.findById(conversationId);
      if (!conversation) throw new NotFoundError("Conversation not found");
      
      // Security Check: Is the sender a participant?
      const isParticipant = senderRole === 'student' 
        ? conversation.studentId === senderId 
        : conversation.adminId === senderId;
        
      if (!isParticipant) {
        throw new Error("Unauthorized: You are not a participant in this conversation");
      }
    } else if (adminId && senderRole === 'student') {
      // Validate adminId
      const admin = await adminRepository.findByIdWithoutPassword(adminId);
      if (!admin) {
          throw new Error("Invalid Administrator selected");
      }
      conversation = await conversationRepository.findOrCreate(senderId, adminId);
    } else {
      throw new Error("Conversation ID or Admin ID is required to send a message");
    }

    const message = await messageRepository.create({
      conversationId: conversation.id,
      senderId,
      senderRole,
      content,
      type: type || "text",
      fileUrl: fileInfo?.url,
      fileName: fileInfo?.name,
      fileSize: fileInfo?.size,
      status: "sent",
    });

    // Update last message in conversation
    await conversationRepository.updateLastMessage(conversation.id, content);
    
    // Broadcast via Socket.io if globally available (set in index.js)
    try {
      const io = process.app?.get?.("io");
      if (io) {
        io.to(`conversation:${conversation.id}`).emit("message:new", message);
        // Also notify the specific user to refresh their conversation list
        const recipientId = senderRole === "student" ? conversation.adminId : conversation.studentId;
        io.to(`user:${recipientId}`).emit("conversations:refresh");
      }
    } catch (err) {
      console.error("Socket broadcast failed:", err);
    }

    // Properly increment unread count for the RECIPIENT
    if (senderRole === "student") {
      // Notify Admin
      await conversationRepository.incrementUnreadCountAdmin(conversation.id);
    } else if (senderRole === "admin") {
      // Notify Student
      await conversationRepository.incrementUnreadCountStudent(conversation.id);
    }

    return message;
  }
}

export default new MessageService();
