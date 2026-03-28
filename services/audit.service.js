import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

class AuditService {
  /**
   * Log an administrative action
   * @param {Object} params Audit parameters
   * @param {string} params.action - Action name (e.g., 'UPDATE_STATUS')
   * @param {string} params.resource - Resource type (e.g., 'Scholarship')
   * @param {string} params.resourceId - ID of the resource
   * @param {string} params.adminId - ID of the admin performing the action
   * @param {Object} [params.metadata] - Optional context (old/new values)
   * @param {string} [params.ip] - IP address
   * @param {string} [params.userAgent] - User agent
   */
  async log({
    action,
    resource,
    resourceId,
    adminId,
    metadata,
    ip,
    userAgent,
  }) {
    try {
      const auditEntry = await prisma.auditLog.create({
        data: {
          action,
          resource,
          resourceId,
          admin: { connect: { id: adminId } },
          metadata: metadata || {},
          ip,
          userAgent,
        },
      });

      logger.info(`Audit Log Created: ${action}`, {
        auditId: auditEntry.id,
        resource,
        resourceId,
        adminId,
      });

      return auditEntry;
    } catch (error) {
      // We don't want audit logging failures to crash the main request,
      // but we MUST know about them.
      logger.error("CRITICAL: Audit logging failed", {
        error: error.message,
        attemptedAction: action,
      });
    }
  }

  /**
   * Get recent audit logs for the dashboard
   */
  async getRecentLogs(limit = 50) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export default new AuditService();
