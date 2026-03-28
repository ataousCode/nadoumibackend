import BaseRepository from "./base.repository.js";

class ConversationRepository extends BaseRepository {
  constructor() {
    super("Conversation");
  }

  async findByStudentId(studentId) {
    return await this.model.findMany({
      where: { studentId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });
  }

  async findByAdminId(adminId) {
    return await this.model.findMany({
      where: { adminId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });
  }

  async findByParticipants(studentId, adminId) {
    return await this.model.findFirst({
      where: {
        studentId,
        adminId: adminId || null,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async findOrCreate(studentId, adminId) {
    const existing = await this.findByParticipants(studentId, adminId);
    if (existing) return existing;

    return await this.model.create({
      data: {
        studentId,
        adminId: adminId || null,
        unreadCount: 0,
        lastMessageAt: new Date(),
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async updateLastMessage(id, content) {
    return await this.model.update({
      where: { id },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    });
  }

  async incrementUnreadCount(id) {
    return await this.model.update({
      where: { id },
      data: {
        unreadCount: { increment: 1 },
      },
    });
  }

  async resetUnreadCount(id) {
    return await this.model.update({
      where: { id },
      data: {
        unreadCount: 0,
      },
    });
  }
}

export default new ConversationRepository();
