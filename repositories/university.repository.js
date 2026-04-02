import BaseRepository from "./base.repository.js";

class UniversityRepository extends BaseRepository {
  constructor() {
    super("University", "universityId");
  }

  async findByAnyId(id) {
    return super.findByAnyId(id, { 
      customIdField: "universityId",
      include: { scholarships: true, createdBy: true }
    });
  }

  async findAll(params = {}) {
    return super.findAll({
      ...params,
      include: { scholarships: true, createdBy: true },
    });
  }

  async findRecommended(limit = 6) {
    return super.findAll({
      where: {
        status: "active",
        isRecommended: true
      },
      take: limit,
      include: { scholarships: true }
    });
  }

  async findAllSpecial(type, limit = 6) {
    // Strictly return only specifically flagged items
    return await super.findAll({
      where: {
        status: "active",
        [type]: true
      },
      take: limit,
      include: { scholarships: true }
    });
  }

  async updateStatus(id, status) {
    const university = await this.findByAnyId(id);
    return super.update(university.id, { status });
  }
}

export default new UniversityRepository();
