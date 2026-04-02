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
    const featured = await super.findAll({
      where: {
        status: "published",
        isRecommended: true,
        applicationDeadline: { gte: new Date() },
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

    if (featured.length > 0) return featured;

    // Fallback: Return latest published scholarships with future deadlines
    return await super.findAll({
      where: {
        status: "published",
        applicationDeadline: { gte: new Date() },
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
    const special = await super.findAll({
      where: {
        status: "published",
        [type]: true,
        applicationDeadline: { gte: new Date() },
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

    if (special.length > 0) return special;

    // Fallback: Return latest published scholarships
    return await super.findAll({
      where: {
        status: "published",
        applicationDeadline: { gte: new Date() },
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
