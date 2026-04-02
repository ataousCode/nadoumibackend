import universityRepository from "../repositories/university.repository.js";
import BaseService from "./base.service.js";
import { generateUniversityId } from "../utils/idGenerator.js";
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_LIMIT,
  UNIVERSITY_STATUS,
} from "../config/constants.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";

class UniversityService extends BaseService {
  constructor() {
    super(universityRepository, "University");
  }

  generateUniversityId() {
    return generateUniversityId();
  }

  async getAll(filters = {}) {
    const {
      city,
      province,
      type,
      search,
      page = PAGINATION_DEFAULT_PAGE,
      limit = PAGINATION_DEFAULT_LIMIT,
      status,
      scholarshipAvailability,
      isAdmin,
    } = filters;

    const query = {};
    const queryStatus =
      status || (isAdmin ? undefined : UNIVERSITY_STATUS.ACTIVE);

    if (queryStatus) query.status = queryStatus;
    if (city) query.city = city;
    if (province) query.province = province;
    if (type) query.type = type;
    if (scholarshipAvailability)
      query.scholarshipAvailability = scholarshipAvailability;
    if (filters.isRecommended !== undefined) {
      query.isRecommended =
        filters.isRecommended === "true" || filters.isRecommended === true;
    }
    if (filters.isPartner !== undefined) {
      query.isPartner =
        filters.isPartner === "true" || filters.isPartner === true;
    }
    if (filters.isTop !== undefined) {
      query.isTop = filters.isTop === "true" || filters.isTop === true;
    }

    // Advanced Filtering (QS Rankings)
    if (filters.rankMin || filters.rankMax) {
      query.qsRank = {};
      if (filters.rankMin) query.qsRank.gte = parseInt(filters.rankMin);
      if (filters.rankMax) query.qsRank.lte = parseInt(filters.rankMax);
    }

    if (search) {
      query.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameInChinese: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { province: { contains: search, mode: "insensitive" } },
        { universityId: { contains: search, mode: "insensitive" } },
        { introduction: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { searchKeywords: { contains: search, mode: "insensitive" } },
        { searchTags: { hasSome: [search] } },
      ];
    }

    // SMART FALLBACK LOGIC for Home Page sections
    // If we're filtering by a SINGLE specialty flag for the home page, use smart fetch
    const specialtyFlags = ['isRecommended', 'isPartner', 'isTop'];
    const activeFlags = specialtyFlags.filter(f => filters[f] === "true" || filters[f] === true);

    if (activeFlags.length === 1 && !search && !city && !province && !type) {
      const type = activeFlags[0];
      const universities = await this.repository.findAllSpecial(type, parseInt(limit));
      return {
        universities,
        pagination: { total: universities.length, page: 1, limit: parseInt(limit), pages: 1 }
      };
    }

    const { skip, take } = parsePagination(page, limit);

    const [universities, total] = await Promise.all([
      this.repository.findAll({ where: query, skip, take }),
      this.repository.count(query),
    ]);

    return buildPaginatedResponse(
      "universities",
      universities,
      total,
      page,
      limit,
    );
  }

  async create(universityData, adminId) {
    const data = {
      ...universityData,
      adminId,
      universityId: universityData.universityId || this.generateUniversityId(),
      numberOfPrograms: this._calculateProgramCount(universityData.majors),
    };
    return super.create(data, adminId);
  }

  async update(id, universityData, adminId) {
    const data = {
      ...universityData,
      numberOfPrograms: this._calculateProgramCount(universityData.majors),
    };
    return super.update(id, data, adminId);
  }

  _calculateProgramCount(majors) {
    if (!majors || !Array.isArray(majors)) return 0;
    return majors.reduce((acc, cat) => acc + (cat.list?.length || 0), 0);
  }
}

export default new UniversityService();
