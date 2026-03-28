import BaseRepository from "./base.repository.js";

class ProgramRepository extends BaseRepository {
  constructor() {
    // Model name in Prisma is 'ScholarshipProgram'
    super("ScholarshipProgram");
  }

  async findByAnyId(id, options = {}) {
    return super.findByAnyId(id, {
      ...options,
      include: {
        scholarship: {
          include: {
            universities: true,
          },
        },
        accommodations: true,
      },
    });
  }

  async findAll(params = {}) {
    return super.findAll({
      ...params,
      include: {
        scholarship: {
          include: {
            universities: true,
          },
        },
        accommodations: true,
      },
    });
  }
  

  /**
   * Get distinct fields (subjects) from scholarship programs
   */
  async getCategories() {
    const fields = await this.model.findMany({
      where: { field: { not: null } },
      select: { field: true },
      distinct: ["field"],
    });
    return fields.map((f) => f.field);
  }
}

export default new ProgramRepository();
