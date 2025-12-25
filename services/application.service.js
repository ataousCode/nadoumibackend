import applicationRepository from '../repositories/application.repository.js'
import Application from '../models/Application.js'
import Scholarship from '../models/Scholarship.js'
import emailService from './email.service.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { generateApplicationId } from '../utils/idGenerator.js'

class ApplicationService {
  generateApplicationId() {
    return generateApplicationId()
  }

  async getAll(filters = {}) {
    const { scholarshipId, status } = filters
    const query = {}
    
    if (scholarshipId) query.scholarship = scholarshipId
    if (status) query.status = status

    const applications = await Application.find(query)
      .populate('student', 'firstName lastName email phone nationality dateOfBirth country passportNumber')
      .populate('scholarship', 'title university')
      .sort({ submittedAt: -1 })
    
    return applications
  }

  async getByStatus(status) {
    return await Application.find({ status })
      .sort({ submittedAt: -1 })
  }

  async getByScholarship(scholarshipId) {
    return await Application.find({ scholarship: scholarshipId })
      .populate('student', 'firstName lastName email phone nationality')
      .populate('scholarship')
      .sort({ submittedAt: -1 })
  }

  async getById(id) {
    const application = await applicationRepository.findByAnyId(id)
    await application.populate('student', 'firstName lastName email phone nationality dateOfBirth country passportNumber')
    await application.populate('scholarship')
    return application
  }

  async getStudentApplications(studentId) {
    return await Application.find({ student: studentId })
      .populate('scholarship')
      .sort({ submittedAt: -1 })
  }

  async getStudentApplicationById(studentId, applicationId) {
    const application = await Application.findOne({
      _id: applicationId,
      student: studentId
    })
      .populate('scholarship')
      .populate('student')
    
    if (!application) {
      throw new NotFoundError('Application')
    }
    
    return application
  }

  async createApplication(studentId, applicationData) {
    const { scholarshipId, preferences, documents } = applicationData

    if (!scholarshipId) {
      throw new ValidationError('Scholarship ID is required')
    }

    const scholarship = await Scholarship.findById(scholarshipId)
    if (!scholarship) {
      throw new NotFoundError('Scholarship')
    }

    if (scholarship.status !== 'published') {
      throw new ValidationError('Scholarship is not available for applications')
    }

    if (new Date(scholarship.applicationDeadline) < new Date()) {
      throw new ValidationError('Application deadline has passed')
    }

    const existing = await Application.findOne({
      student: studentId,
      scholarship: scholarshipId
    })

    if (existing) {
      throw new ValidationError('You have already applied for this scholarship')
    }

    const applicationId = this.generateApplicationId()

    const application = new Application({
      applicationId,
      id: applicationId,
      student: studentId,
      scholarship: scholarshipId,
      preferences: preferences || {},
      documents: documents || {},
      status: 'pending',
      submittedAt: new Date(),
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Application submitted'
      }]
    })

    await application.save()
    
    const populated = await Application.findById(application._id)
      .populate('scholarship')
      .populate('student')

    try {
      await emailService.sendNewApplicationNotificationToAdmin({
        applicationId: populated.applicationId || populated.id,
        id: populated._id,
        student: populated.student,
        scholarship: populated.scholarship,
        submittedAt: populated.submittedAt,
      })
    } catch (error) {
      console.error('Failed to send admin notification (non-blocking):', error)
    }

    return populated
  }

  async updateApplication(studentId, applicationId, updateData) {
    const application = await Application.findOne({
      _id: applicationId,
      student: studentId
    })

    if (!application) {
      throw new NotFoundError('Application')
    }

    if (application.status !== 'pending') {
      throw new ValidationError('Cannot update application after review has started')
    }

    const { preferences, documents } = updateData

    if (preferences) {
      application.preferences = { ...application.preferences, ...preferences }
    }

    if (documents) {
      application.documents = { ...application.documents, ...documents }
    }

    await application.save()
    
    const populated = await Application.findById(application._id)
      .populate('scholarship')
      .populate('student')

    return populated
  }

  async create(applicationData) {
    const id = this.generateApplicationId()

    const application = new Application({
      ...applicationData,
      id,
      applicationId: id,
      status: 'pending',
      submittedAt: new Date(),
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Application submitted'
      }]
    })

    await application.save()
    
    return { id: application.id }
  }

  async updateStatus(applicationId, statusData, adminEmail) {
    let { status, note, metadata } = statusData
    
    if (status) {
      status = status.toLowerCase()
      if (status === 'interview' || status === 'interview_scheduled' || status === 'interviewscheduled') {
        status = 'interview'
      }
      if (status === 'interview_passed' || status === 'interviewpassed') {
        status = 'interview_passed'
      }
      if (status === 'interview_failed' || status === 'interviewfailed') {
        status = 'rejected'
        if (metadata) {
          metadata.rejectionReason = metadata.rejectionReason || 'interview_failed'
          metadata.rejectionFeedback = metadata.interviewFailureReason || metadata.rejectionFeedback || 'Interview did not meet requirements'
        }
      }
    }
    
    const application = await applicationRepository.findByAnyId(applicationId)

    const historyEntry = {
      status,
      timestamp: new Date(),
      note: note || '',
      adminEmail,
      metadata: metadata || {}
    }

    application.status = status
    application.statusHistory.push(historyEntry)

    if (status === 'interview' && metadata) {
      application.interviewDetails = {
        date: metadata.interviewDate || null,
        time: metadata.interviewTime || null,
        videoCallPlatform: metadata.videoCallPlatform || null,
        videoCallLink: metadata.videoCallLink || null,
        notes: metadata.interviewNotes || null,
        scheduledAt: new Date()
      }
    }

    if (status === 'rejected' && metadata?.rejectionReason) {
      application.rejectionDetails = {
        reason: metadata.rejectionReason,
        feedback: metadata.rejectionFeedback || null,
        rejectedAt: new Date()
      }
    }

    if (status === 'revoked' && metadata) {
      application.revocationDetails = {
        reason: metadata.revocationReason || null,
        details: metadata.revocationDetails || null,
        revokedAt: new Date()
      }
    }

    if (status === 'accepted') {
      application.acceptedAt = new Date()
    }

    if (status === 'interview_passed') {
      application.interviewPassedAt = new Date()
    }

    await application.save()
    
    const populated = await Application.findById(application._id)
      .populate('student')
      .populate('scholarship')

    if (populated.student) {
      try {
        if (status === 'interview') {
          await emailService.sendInterviewNotification(
            populated.student.email,
            populated.student.firstName || 'Student',
            {
              applicationId: populated.applicationId,
              scholarshipTitle: populated.scholarship?.title || 'Scholarship',
              interviewDate: metadata?.interviewDate,
              interviewTime: metadata?.interviewTime,
              videoCallPlatform: metadata?.videoCallPlatform,
              videoCallLink: metadata?.videoCallLink,
              notes: metadata?.interviewNotes,
              adminNote: note
            }
          )
        } else if (status === 'interview_passed') {
          await emailService.sendInterviewPassedNotification(
            populated.student.email,
            populated.student.firstName || 'Student',
            {
              applicationId: populated.applicationId,
              scholarshipTitle: populated.scholarship?.title || 'Scholarship',
              adminNote: note
            }
          )
        } else if (status === 'rejected' && metadata?.rejectionReason === 'interview_failed') {
          await emailService.sendInterviewFailedNotification(
            populated.student.email,
            populated.student.firstName || 'Student',
            {
              applicationId: populated.applicationId,
              scholarshipTitle: populated.scholarship?.title || 'Scholarship',
              failureReason: metadata?.interviewFailureReason || metadata?.rejectionFeedback || 'Interview did not meet requirements',
              adminNote: note
            }
          )
        } else if (status === 'revoked') {
          await emailService.sendRevokedNotification(
            populated.student.email,
            populated.student.firstName || 'Student',
            {
              applicationId: populated.applicationId,
              scholarshipTitle: populated.scholarship?.title || 'Scholarship',
              revocationReason: metadata?.revocationReason || 'Missing documents or information',
              revocationDetails: metadata?.revocationDetails || '',
              adminNote: note
            }
          )
        }
      } catch (emailError) {
        console.error('Failed to send status notification email:', emailError)
      }
    }

    return populated
  }

  async delete(applicationId) {
    await applicationRepository.delete(applicationId)
    return { id: applicationId }
  }

  async search(term) {
    const searchTerm = term.toLowerCase()
    return await Application.find({
      $or: [
        { 'applicant.firstName': { $regex: searchTerm, $options: 'i' } },
        { 'applicant.lastName': { $regex: searchTerm, $options: 'i' } },
        { 'applicant.email': { $regex: searchTerm, $options: 'i' } },
        { id: { $regex: searchTerm, $options: 'i' } },
        { applicationId: { $regex: searchTerm, $options: 'i' } }
      ]
    })
      .populate('student', 'firstName lastName email')
      .populate('scholarship', 'title')
      .sort({ submittedAt: -1 })
  }

  async uploadAdminDocument(applicationId, documentType, filename, adminEmail) {
    if (!['admission', 'jw202'].includes(documentType)) {
      throw new ValidationError('Invalid document type. Must be "admission" or "jw202"')
    }

    const application = await applicationRepository.findByAnyId(applicationId)
    const filePath = `/uploads/applications/${application.applicationId || applicationId}/admin-docs/${filename}`
    
    if (application.status !== 'accepted') {
      throw new ValidationError('Documents can only be uploaded for accepted applications')
    }
    
    if (documentType === 'admission') {
      application.admissionDocument = {
        path: filePath,
        uploadedAt: new Date(),
        uploadedBy: adminEmail
      }
    } else if (documentType === 'jw202') {
      application.jw202Document = {
        path: filePath,
        uploadedAt: new Date(),
        uploadedBy: adminEmail
      }
    }
    
    await application.save()
    
    try {
      const populated = await Application.findById(application._id)
        .populate('student')
        .populate('scholarship')
      
      if (populated.student) {
        await emailService.sendDocumentUploadedNotification(
          populated.student.email,
          populated.student.firstName || 'Student',
          {
            applicationId: populated.applicationId,
            scholarshipTitle: populated.scholarship?.title || 'Scholarship',
            documentType: documentType === 'admission' ? 'Admission Letter' : 'JW202 Form',
            documentPath: filePath
          }
        )
      }
    } catch (emailError) {
      console.error('Failed to send document upload notification email:', emailError)
    }
    
    const updated = await Application.findById(application._id)
      .populate('student')
      .populate('scholarship')
    
    return updated
  }
}

export default new ApplicationService()
