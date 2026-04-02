import BaseRepository from "./base.repository.js";

class ScholarshipRepository extends BaseRepository {
  constructor() {
    super("Scholarship", "scholarshipId");
  }

  async findByAnyId(id) {
    return super.findByAnyId(id, {
      customIdField: "scholarshipId",
      include: {
        universities: true,
        programs: {
          include: { accommodations: true }
        },
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async findAll(params = {}) {
    return super.findAll({
      ...params,
      include: {
        universities: true,
        programs: {
          include: { accommodations: true }
        },
        createdBy: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async findFeatured(limit = 6) {
    return await super.findAll({
      where: {
        status: "published",
        isRecommended: true,
      },
      take: limit,
      include: {
        universities: true,
        programs: {
          include: { accommodations: true }
        },
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async findSpecial(type, limit = 6) {
    return await super.findAll({
      where: {
        status: "published",
        [type]: true,
      },
      take: limit,
      include: {
        universities: true,
        programs: {
          include: { accommodations: true }
        },
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async updateStatus(id, status) {
    const scholarship = await this.findByAnyId(id);
    return super.update(scholarship.id, { status });
  }
}

export default new ScholarshipRepository();
