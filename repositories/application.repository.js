import BaseRepository from "./base.repository.js";

class ApplicationRepository extends BaseRepository {
  constructor() {
    super("Application", "applicationId");
  }

  async findAll(params = {}) {
    const { orderBy = { submittedAt: "desc" }, ...rest } = params;
    return super.findAll({ orderBy, ...rest });
  }

  async findByAnyId(id, include) {
    return super.findByAnyId(id, {
      customIdField: "applicationId",
      include: include || {
        student: true,
        scholarship: {
          include: { 
            universities: true,
            programs: { include: { accommodations: true } }
          },
        },
      },
    });
  }

  async findByLegacyId(legacyId) {
    return await this.model.findFirst({
      where: { legacyId: legacyId.toString() },
    });
  }

  async findByStudentId(studentId) {
    return await this.model.findMany({
      where: { studentId },
      orderBy: { submittedAt: "desc" },
      include: {
        scholarship: {
          include: { 
            universities: true,
            programs: { include: { accommodations: true } }
          },
        },
      },
    });
  }

  async findAllWithRelations(where = {}, { skip, take } = {}) {
    return await this.model.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip,
      take,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            nationality: true,
            dateOfBirth: true,
            country: true,
            passportNumber: true,
          },
        },
        scholarship: {
          include: { 
            universities: true,
            programs: { select: { id: true, category: true } }
          },
        },
      },
    });
  }

  async findByStudentAndId(studentId, applicationId) {
    const application = await this.model.findFirst({
      where: { id: applicationId, studentId },
      include: { scholarship: true, student: true },
    });
    if (!application) throw new NotFoundError("Application");
    return application;
  }

  async findExistingApplication(studentId, scholarshipId) {
    return await this.model.findFirst({
      where: { studentId, scholarshipId },
    });
  }

  async search(term) {
    return await this.model.findMany({
      where: {
        OR: [
          { applicationId: { contains: term, mode: "insensitive" } },
          { id: { contains: term, mode: "insensitive" } },
          {
            student: {
              OR: [
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
                { email: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        ],
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        scholarship: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
  }
}

export default new ApplicationRepository();
