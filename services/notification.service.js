import logger from "../utils/logger.js";

class NotificationService {
  constructor() {
    this.io = null;
  }

  init(io) {
    this.io = io;
    logger.info("NotificationService initialized with Socket.io");
  }

  /**
   * Notify admins about a new application
   */
  notifyNewApplication(application) {
    if (!this.io) {
      logger.warn("Socket.io not initialized in NotificationService. Skipping notification.");
      return;
    }

    const payload = {
      type: "NEW_APPLICATION",
      message: `New application received for ${application.scholarship?.title || "a scholarship"}`,
      applicationId: application.applicationId,
      studentName: `${application.student?.firstName} ${application.student?.lastName}`,
      timestamp: new Date(),
    };

    // Emit to all connected admins (or a specific 'admins' room)
    this.io.emit("admin:notification", payload);
    logger.debug("Real-time notification sent for new application", { applicationId: application.id });
  }

  /**
   * Generic notification emitter
   */
  emit(event, room, data) {
    if (!this.io) return;
    if (room) {
      this.io.to(room).emit(event, data);
    } else {
      this.io.emit(event, data);
    }
  }
}

export default new NotificationService();
