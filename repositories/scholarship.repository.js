import Scholarship from '../models/Scholarship.js'
import mongoose from 'mongoose'
import { NotFoundError } from '../utils/errors.js'

class ScholarshipRepository {
  async findByAnyId(id) {
    const query = []
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    query.push({ scholarshipId: id })
    
    const scholarship = await Scholarship.findOne({ $or: query })
    if (!scholarship) {
      throw new NotFoundError('Scholarship')
    }
    return scholarship
  }

  async findByAnyIdOrNull(id) {
    const query = []
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    query.push({ scholarshipId: id })
    return await Scholarship.findOne({ $or: query })
  }

  async findAll(query = {}) {
    return await Scholarship.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'email name')
  }

  async count(query = {}) {
    return await Scholarship.countDocuments(query)
  }

  async create(scholarshipData) {
    const scholarship = new Scholarship(scholarshipData)
    await scholarship.save()
    return scholarship
  }

  async update(id, updateData) {
    const scholarship = await this.findByAnyId(id)
    Object.assign(scholarship, updateData)
    await scholarship.save()
    return scholarship
  }

  async delete(id) {
    const scholarship = await this.findByAnyId(id)
    await Scholarship.findByIdAndDelete(scholarship._id)
    return scholarship
  }

  async updateStatus(id, status) {
    const scholarship = await this.findByAnyId(id)
    scholarship.status = status
    await scholarship.save()
    return scholarship
  }
}

export default new ScholarshipRepository()
