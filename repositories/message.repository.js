import BaseRepository from "./base.repository.js";

class MessageRepository extends BaseRepository {
  constructor() {
    super("Message");
  }

  async findByConversationId(conversationId) {
    return await this.model.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async markAsRead(conversationId, readerId) {
    console.log(`[Repository] Marking messages as read in ${conversationId} for reader ${readerId}`);
    return await this.model.updateMany({
      where: { 
        conversationId,
        senderId: { not: readerId },
        status: { not: "read" }
      },
      data: { status: "read" },
    });
  }
}

export default new MessageRepository();
