import auditService from "./audit.service.js";

class BaseService {
  constructor(repository, resourceName) {
    this.repository = repository;
    this.resourceName = resourceName;
  }

  async logAudit(adminId, actionType, resourceId, metadata = {}) {
    if (!adminId) return;
    await auditService.log({
      action: actionType,
      resource: this.resourceName,
      resourceId,
      adminId,
      metadata,
    });
  }

  async getAll(params = {}) {
    return this.repository.findAll(params);
  }

  async getById(id) {
    return this.repository.findByAnyId(id);
  }

  async create(data, adminId, extraAuditMetadata = {}) {
    const record = await this.repository.create(data);

    if (adminId) {
      await auditService.log({
        action: `CREATE_${this.resourceName.toUpperCase()}`,
        resource: this.resourceName,
        resourceId: record.id,
        adminId,
        metadata: { ...data, ...extraAuditMetadata },
      });
    }

    return record;
  }

  async update(id, data, adminId, extraAuditMetadata = {}) {
    const record = await this.repository.update(id, data);

    if (adminId) {
      await auditService.log({
        action: `UPDATE_${this.resourceName.toUpperCase()}`,
        resource: this.resourceName,
        resourceId: id,
        adminId,
        metadata: { ...data, ...extraAuditMetadata },
      });
    }

    return record;
  }

  async delete(id, adminId) {
    const record = await this.repository.delete(id);

    if (adminId) {
      await auditService.log({
        action: `DELETE_${this.resourceName.toUpperCase()}`,
        resource: this.resourceName,
        resourceId: id,
        adminId,
      });
    }

    return record;
  }

  async updateStatus(id, status, adminId, extraAuditMetadata = {}) {
    const record = await this.repository.updateStatus(id, status);

    if (adminId) {
      await auditService.log({
        action: `UPDATE_${this.resourceName.toUpperCase()}_STATUS`,
        resource: this.resourceName,
        resourceId: id,
        adminId,
        metadata: { status, ...extraAuditMetadata },
      });
    }

    return record;
  }
}

export default BaseService;
