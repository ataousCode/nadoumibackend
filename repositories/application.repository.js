import Application from '../models/Application.js'
import mongoose from 'mongoose'
import { NotFoundError } from '../utils/errors.js'

class ApplicationRepository {
  async findByAnyId(id) {
    const query = []
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    
    query.push({ id })
    query.push({ applicationId: id })
    
    const application = await Application.findOne({ $or: query })
    
    if (!application) {
      throw new NotFoundError('Application')
    }
    
    return application
  }

  async findByAnyIdOrNull(id) {
    const query = []
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    
    query.push({ id })
    query.push({ applicationId: id })
    
    return await Application.findOne({ $or: query })
  }

  async findAll(filters = {}) {
    return await Application.find(filters)
      .sort({ submittedAt: -1 })
  }

  async create(applicationData) {
    const application = new Application(applicationData)
    await application.save()
    return application
  }

  async update(id, updateData) {
    const application = await this.findByAnyId(id)
    
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        application[key] = updateData[key]
      }
    })
    
    await application.save()
    return application
  }

  async delete(id) {
    const application = await this.findByAnyId(id)
    await Application.findByIdAndDelete(application._id)
    return application
  }
}

export default new ApplicationRepository()
