import prisma from "../config/prisma.js";
import { NotFoundError } from "../utils/errors.js";
import { isUuid, handlePrismaError } from "../utils/prisma.js";

class BaseRepository {
  constructor(modelName, customIdField = null) {
    this.modelName = modelName;
    // Prisma model instances are camelCase with lowercase first letter (e.g., 'systemSetting' for 'SystemSetting')
    const prismaModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    this.model = prisma[prismaModelName];
    
    if (!this.model) {
      console.warn(`Prisma model "${prismaModelName}" not found. Falling back to lowercased name.`);
      this.model = prisma[modelName.toLowerCase()];
    }
    
    this.customIdField = customIdField;
  }

  async findByAnyId(id, options = {}) {
    const { include, customIdField = this.customIdField } = options;
    const uuidId = isUuid(id) ? id : undefined;

    const record = await this.model.findFirst({
      where: {
        OR: [
          uuidId ? { id } : undefined,
          customIdField ? { [customIdField]: id } : undefined,
        ].filter(Boolean),
      },
      include,
    });

    if (!record) {
      throw new NotFoundError(this.modelName);
    }
    return record;
  }

  async findByAnyIdOrNull(id, options = {}) {
    const { customIdField = this.customIdField } = options;
    const uuidId = isUuid(id) ? id : undefined;

    return await this.model.findFirst({
      where: {
        OR: [
          uuidId ? { id } : undefined,
          customIdField ? { [customIdField]: id } : undefined,
        ].filter(Boolean),
      },
    });
  }

  async findAll(params = {}) {
    const {
      where = {},
      skip,
      take,
      orderBy = { createdAt: "desc" },
      include,
      select,
    } = params;
    
    // Prisma does not allow both include and select
    const queryOptions = {
      where,
      skip,
      take,
      orderBy,
    };

    if (select) {
      queryOptions.select = select;
    } else if (include) {
      queryOptions.include = include;
    }

    return await this.model.findMany(queryOptions);
  }

  async findById(id, include) {
    const record = await this.model.findUnique({
      where: { id },
      include,
    });
    if (!record) throw new NotFoundError(this.modelName);
    return record;
  }

  async count(where = {}) {
    return await this.model.count({ where });
  }

  async create(data) {
    try {
      return await this.model.create({ data });
    } catch (error) {
      handlePrismaError(error, this.modelName);
    }
  }

  async update(id, data) {
    try {
      const record = await this.findByAnyId(id);
      return await this.model.update({
        where: { id: record.id },
        data,
      });
    } catch (error) {
      handlePrismaError(error, this.modelName);
    }
  }

  async delete(id) {
    try {
      const record = await this.findByAnyId(id);
      return await this.model.delete({
        where: { id: record.id },
      });
    } catch (error) {
      handlePrismaError(error, this.modelName);
    }
  }
}

export default BaseRepository;
