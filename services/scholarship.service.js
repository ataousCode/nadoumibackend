import scholarshipRepository from "../repositories/scholarship.repository.js";
import BaseService from "./base.service.js";
import cacheService from "./cache.service.js";
import universityRepository from "../repositories/university.repository.js";
import { ValidationError } from "../utils/errors.js";
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_LIMIT,
  SCHOLARSHIP_STATUS,
} from "../config/constants.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";
import { sanitizeUpdateData } from "../utils/prisma.js";

class ScholarshipService extends BaseService {
  constructor() {
    super(scholarshipRepository, "Scholarship");
  }

  async getAll(filters = {}) {
    const {
      category,
      country,
      search,
      page = PAGINATION_DEFAULT_PAGE,
      limit = PAGINATION_DEFAULT_LIMIT,
      status,
      programCategory, // Existing singular filter (from URL)
      programCategories, // New array filter (from Sidebar)
      scholarshipCategory,
      isHot,
      isRecommended,
      isAdmin,
      city,
      field,
      rankMin,
      rankMax,
      teachingLanguage,
      maxTuition,
    } = filters;

    const query = {};
    const queryStatus =
      status || (isAdmin ? undefined : SCHOLARSHIP_STATUS.PUBLISHED);

    if (queryStatus) query.status = queryStatus;
    if (category) query.category = category;
    // Unify programCategory and programCategories
    const catsToFilter = [];
    if (programCategory && programCategory !== "all") catsToFilter.push(programCategory);
    if (Array.isArray(programCategories)) catsToFilter.push(...programCategories);
    else if (programCategories && programCategories !== "all") catsToFilter.push(programCategories);
    
    if (catsToFilter.length > 0) {
      // Remove duplicates and ensure they are valid Enum values if possible
      const uniqueCats = [...new Set(catsToFilter)];
      query.programCategories = { hasSome: uniqueCats };
    }
    if (scholarshipCategory) query.scholarshipCategory = scholarshipCategory;
    if (isHot !== undefined) query.isHot = isHot === "true" || isHot === true;
    if (isRecommended !== undefined)
      query.isRecommended = isRecommended === "true" || isRecommended === true;
    if (filters.isTop !== undefined)
      query.isTop = filters.isTop === "true" || filters.isTop === true;
    
    if (country) query.universities = { some: { country } };
    if (city) query.universities = { some: { city: { contains: city, mode: "insensitive" } } };
    
    if (field && field !== "All Categories") {
      query.field = { contains: field, mode: "insensitive" };
    }
    
    if (teachingLanguage) {
      query.teachingLanguage = teachingLanguage;
    }

    if (maxTuition) {
      query.tuitionFeeAfterScholarship = { lte: parseFloat(maxTuition) };
    }

    if (rankMin || rankMax) {
      query.universities = {
        ...query.universities,
        some: {
          ...query.universities?.some,
          qsRank: {
            gte: rankMin ? parseInt(rankMin) : undefined,
            lte: rankMax ? parseInt(rankMax) : undefined,
          }
        }
      };
    }
    if (search) {
      query.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { titleInChinese: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { programName: { contains: search, mode: "insensitive" } },
        {
          universities: {
            some: { name: { contains: search, mode: "insensitive" } },
          },
        },
        {
          universities: {
            some: { nameInChinese: { contains: search, mode: "insensitive" } },
          },
        },
        {
          universities: {
            some: { city: { contains: search, mode: "insensitive" } },
          },
        },
        {
          universities: {
            some: { province: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    const { skip, take } = parsePagination(page, limit);

    const [scholarships, total] = await Promise.all([
      this.repository.findAll({ where: query, skip, take }),
      this.repository.count(query),
    ]);

    return buildPaginatedResponse(
      "scholarships",
      scholarships,
      total,
      page,
      limit,
    );
  }

  async getFeatured() {
    return cacheService.getOrSet("scholarships:featured", () =>
      this.repository.findFeatured(),
    );
  }

  async create(scholarshipData, adminId) {
    const scholarshipId =
      scholarshipData.scholarshipId ||
      `NDE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const { universities, programs, ...rest } = scholarshipData;

    const scholarship = await this.repository.create({
      ...rest,
      scholarshipId,
      createdBy: {
        connect: { id: adminId },
      },
      universities: {
        connect: universities?.map((id) => ({ id })) || [],
      },
      programs: {
        create:
          programs?.map((prog) => {
            const { accommodations, ...progData } = prog;
            return {
              ...progData,
              accommodations: {
                create: accommodations || [],
              },
            };
          }) || [],
      },
    });

    await cacheService.invalidate("scholarships:featured");
    return this.repository.findByAnyId(scholarship.id);
  }

  async update(id, updateData, adminId) {
    const { universities, programs, adminId: _, ...rest } = updateData;
    const sanitizedData = sanitizeUpdateData(rest);
    
    if (updateData.applicationDeadline) {
      sanitizedData.applicationDeadline = new Date(updateData.applicationDeadline);
    }

    const scholarship = await super.update(
      id,
      {
        ...sanitizedData,
        ...(universities && {
          universities: {
            set: universities.map((uid) => ({ id: uid })),
          },
        }),
        ...(adminId && { createdBy: { connect: { id: adminId } } }),
        ...(programs && {
          programs: {
            deleteMany: {}, // Clear existing programs
            create: programs.map((prog) => {
              const { id: _pId, accommodations, ...progData } = prog;
              return {
                ...progData,
                accommodations: {
                  create:
                    accommodations?.map((acc) => {
                      const { id: _aId, ...accData } = acc;
                      return accData;
                    }) || [],
                },
              };
            }),
          },
        }),
      },
      adminId,
    );
    await cacheService.invalidate("scholarships:featured");
    return this.repository.findByAnyId(scholarship.id);
  }

  async delete(id, adminId) {
    const result = await super.delete(id, adminId);
    await cacheService.invalidate("scholarships:featured");
    return result;
  }

  async updateStatus(id, status, adminId) {
    if (!Object.values(SCHOLARSHIP_STATUS).includes(status)) {
      throw new ValidationError("Invalid status");
    }

    const scholarship = await super.updateStatus(id, status, adminId);
    await cacheService.invalidate("scholarships:featured");
    return scholarship;
  }
}

export default new ScholarshipService();
