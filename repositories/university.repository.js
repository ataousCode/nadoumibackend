import University from '../models/University.js'
import mongoose from 'mongoose'
import { NotFoundError } from '../utils/errors.js'

class UniversityRepository {
  async findByAnyId(id) {
    const query = []
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    query.push({ universityId: id })
    
    const university = await University.findOne({ $or: query })
    if (!university) {
      throw new NotFoundError('University')
    }
    return university
  }

  async findAll(query = {}) {
    return await University.find(query)
      .sort({ createdAt: -1 })
      .populate('programs')
      .populate('scholarships')
  }

  async count(query = {}) {
    return await University.countDocuments(query)
  }

  async create(universityData) {
    const university = new University(universityData)
    await university.save()
    return university
  }

  async update(id, updateData) {
    const university = await this.findByAnyId(id)
    Object.assign(university, updateData)
    await university.save()
    return university
  }

  async delete(id) {
    const university = await this.findByAnyId(id)
    await University.findByIdAndDelete(university._id)
    return university
  }

  async updateStatus(id, status) {
    const university = await this.findByAnyId(id)
    university.status = status
    await university.save()
    return university
  }
}

export default new UniversityRepository()
