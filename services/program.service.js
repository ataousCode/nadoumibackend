import BaseService from "./base.service.js";
import programRepository from "../repositories/program.repository.js";

class ProgramService extends BaseService {
  constructor() {
    super(programRepository, "Program");
  }

  async getPrograms(params = {}) {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      teachingLanguage, 
      field, 
      search,
      tuitionMin,
      tuitionMax,
      sort = "popular"
    } = params;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const where = {
      scholarship: {
        status: 'published'
      }
    };

    if (category) {
      // Normalize to Prisma Enum casing (e.g. bachelor -> Bachelor)
      const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      where.category = normalizedCategory;
    }

    if (teachingLanguage) {
      where.teachingLanguage = teachingLanguage;
    }

    if (field) {
      where.OR = [
        { field: { contains: field, mode: "insensitive" } },
        { fields: { has: field } }
      ];
    }

    if (search) {
      where.OR = [
        { programName: { contains: search, mode: "insensitive" } },
        { field: { contains: search, mode: "insensitive" } },
        { fields: { has: search } },
        { majors: { has: search } },
        { 
          scholarship: {
            status: 'published',
            title: { contains: search, mode: "insensitive" }
          }
        }
      ];
    }

    if (tuitionMin !== undefined || tuitionMax !== undefined) {
      where.tuitionFeeAfter = {};
      if (tuitionMin !== undefined) where.tuitionFeeAfter.gte = parseFloat(tuitionMin);
      if (tuitionMax !== undefined) where.tuitionFeeAfter.lte = parseFloat(tuitionMax);
    }

    const [programs, total] = await Promise.all([
      this.repository.findAll({
        where,
        skip,
        take,
        // For 'popular' or 'featured', we could use different ordering logic
        orderBy: sort === "newest" ? { createdAt: "desc" } : { updatedAt: "desc" },
      }),
      this.repository.count(where),
    ]);

    return {
      programs,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getFeaturedPrograms() {
    return this.repository.findAll({
      take: 6,
      orderBy: { updatedAt: "desc" },
    });
  }

  async getCategories() {
    return this.repository.getCategories();
  }
}

export default new ProgramService();
