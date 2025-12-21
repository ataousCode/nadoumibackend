import express from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import Application from '../models/Application.js'
import Scholarship from '../models/Scholarship.js'
import { authenticate, authenticateStudent } from '../middleware/auth.js'
import emailService from '../services/email.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure multer for admin document uploads (admission, JW202)
const adminDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const applicationId = req.params.id || 'temp'
    const uploadPath = path.join(__dirname, '../../uploads/applications', applicationId, 'admin-docs')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^A-Za-z0-9._-]/g, '_')
    const docType = req.body.documentType || 'document'
    cb(null, `${docType}_${Date.now()}_${sanitized}`)
  }
})

const adminDocUpload = multer({ 
  storage: adminDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

const router = express.Router()

function generateApplicationId() {
  const now = new Date()
  const year = now.getFullYear()
  const timestamp = now.getTime()
  const sequence = String(timestamp).slice(-6)
  return `NAD${year}${sequence}`
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { scholarshipId, status } = req.query
    const query = {}
    
    if (scholarshipId) query.scholarship = scholarshipId
    if (status) query.status = status

    const applications = await Application.find(query)
      .populate('student', 'firstName lastName email phone nationality dateOfBirth country passportNumber')
      .populate('scholarship', 'title university')
      .sort({ submittedAt: -1 })
    res.json(applications)
  } catch (error) {
    console.error('Get applications error:', error)
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
})

router.get('/status/:status', authenticate, async (req, res) => {
  try {
    const applications = await Application.find({ status: req.params.status })
      .sort({ submittedAt: -1 })
    res.json(applications)
  } catch (error) {
    console.error('Get applications by status error:', error)
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
})

router.get('/scholarship/:scholarshipId', authenticate, async (req, res) => {
  try {
    const applications = await Application.find({ scholarship: req.params.scholarshipId })
      .populate('student', 'firstName lastName email phone nationality')
      .populate('scholarship')
      .sort({ submittedAt: -1 })
    res.json(applications)
  } catch (error) {
    console.error('Get applications by scholarship error:', error)
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const query = []
    
    // Only include _id in query if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    
    // Always check id and applicationId fields (string fields)
    query.push({ id })
    query.push({ applicationId: id })
    
    const application = await Application.findOne({ $or: query })
      .populate('student', 'firstName lastName email phone nationality dateOfBirth country passportNumber')
      .populate('scholarship')
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }
    res.json(application)
  } catch (error) {
    console.error('Get application error:', error)
    res.status(500).json({ error: 'Failed to fetch application' })
  }
})

router.get('/student/me', authenticateStudent, async (req, res) => {
  try {
    const applications = await Application.find({ student: req.student.id })
      .populate('scholarship')
      .sort({ submittedAt: -1 })
    res.json(applications)
  } catch (error) {
    console.error('Get student applications error:', error)
    res.status(500).json({ error: 'Failed to fetch applications' })
  }
})

router.get('/student/me/:id', authenticateStudent, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      student: req.student.id
    })
      .populate('scholarship')
      .populate('student')
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }
    res.json(application)
  } catch (error) {
    console.error('Get student application error:', error)
    res.status(500).json({ error: 'Failed to fetch application' })
  }
})

router.post('/student/me', authenticateStudent, async (req, res) => {
  try {
    const { scholarshipId, preferences, documents } = req.body

    if (!scholarshipId) {
      return res.status(400).json({ error: 'Scholarship ID is required' })
    }

    const scholarship = await Scholarship.findById(scholarshipId)
    if (!scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' })
    }

    if (scholarship.status !== 'published') {
      return res.status(400).json({ error: 'Scholarship is not available for applications' })
    }

    if (new Date(scholarship.applicationDeadline) < new Date()) {
      return res.status(400).json({ error: 'Application deadline has passed' })
    }

    const existing = await Application.findOne({
      student: req.student.id,
      scholarship: scholarshipId
    })

    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this scholarship' })
    }

    const applicationId = generateApplicationId()

    const application = new Application({
      applicationId,
      id: applicationId,
      student: req.student.id,
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

    // Send notification email to admin
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
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      data: populated
    })
  } catch (error) {
    console.error('Create application error:', error)
    res.status(500).json({ error: 'Failed to create application' })
  }
})

router.put('/student/me/:id', authenticateStudent, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      student: req.student.id
    })

    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot update application after review has started' })
    }

    const { preferences, documents } = req.body

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

    res.json(populated)
  } catch (error) {
    console.error('Update application error:', error)
    res.status(500).json({ error: 'Failed to update application' })
  }
})

router.post('/', async (req, res) => {
  try {
    const data = req.body
    const id = generateApplicationId()

    const application = new Application({
      ...data,
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
    res.json({ id: application.id })
  } catch (error) {
    console.error('Create application error:', error)
    res.status(500).json({ error: 'Failed to create application' })
  }
})

router.put('/:id/status', authenticate, async (req, res) => {
  try {
    let { status, note, metadata } = req.body
    const { id } = req.params
    const query = []
    
    // Normalize status to lowercase
    if (status) {
      status = status.toLowerCase()
      // Handle status variations
      if (status === 'interview' || status === 'interview_scheduled' || status === 'interviewscheduled') {
        status = 'interview'
      }
      if (status === 'interview_passed' || status === 'interviewpassed') {
        status = 'interview_passed'
      }
      if (status === 'interview_failed' || status === 'interviewfailed') {
        status = 'interview_failed'
        // Interview failed automatically becomes rejected
        status = 'rejected'
        if (metadata) {
          metadata.rejectionReason = metadata.rejectionReason || 'interview_failed'
          metadata.rejectionFeedback = metadata.interviewFailureReason || metadata.rejectionFeedback || 'Interview did not meet requirements'
        }
      }
    }
    
    // Only include _id in query if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    
    // Always check id and applicationId fields (string fields)
    query.push({ id })
    query.push({ applicationId: id })
    
    const application = await Application.findOne({ $or: query })
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    const historyEntry = {
      status,
      timestamp: new Date(),
      note: note || '',
      adminEmail: req.admin.email,
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

    // Send email notifications based on status
    if (populated.student) {
      try {
        const emailService = (await import('../services/email.service.js')).default
        
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
        // Don't fail the request if email fails
      }
    }

    res.json(populated)
  } catch (error) {
    console.error('Update application status error:', error)
    res.status(500).json({ error: 'Failed to update application status' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const query = []
    
    // Only include _id in query if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    
    // Always check id and applicationId fields (string fields)
    query.push({ id })
    query.push({ applicationId: id })
    
    const application = await Application.findOneAndDelete({ $or: query })
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }
    res.json({ id: req.params.id })
  } catch (error) {
    console.error('Delete application error:', error)
    res.status(500).json({ error: 'Failed to delete application' })
  }
})

router.get('/search/:term', authenticate, async (req, res) => {
  try {
    const term = req.params.term.toLowerCase()
    const applications = await Application.find({
      $or: [
        { 'applicant.firstName': { $regex: term, $options: 'i' } },
        { 'applicant.lastName': { $regex: term, $options: 'i' } },
        { 'applicant.email': { $regex: term, $options: 'i' } },
        { id: { $regex: term, $options: 'i' } },
        { applicationId: { $regex: term, $options: 'i' } }
      ]
    })
      .populate('student', 'firstName lastName email')
      .populate('scholarship', 'title')
      .sort({ submittedAt: -1 })
    res.json(applications)
  } catch (error) {
    console.error('Search applications error:', error)
    res.status(500).json({ error: 'Failed to search applications' })
  }
})

// Upload admission or JW202 document for accepted application (admin only)
router.put('/:id/admin-documents', authenticate, adminDocUpload.single('file'), async (req, res) => {
  try {
    const { id } = req.params
    const { documentType } = req.body // 'admission' or 'jw202'
    
    if (!documentType || !['admission', 'jw202'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid document type. Must be "admission" or "jw202"' })
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }
    
    const query = []
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.push({ _id: id })
    }
    query.push({ id })
    query.push({ applicationId: id })
    
    const application = await Application.findOne({ $or: query })
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }
    
    // Only allow uploads for accepted applications
    if (application.status !== 'accepted') {
      return res.status(400).json({ error: 'Documents can only be uploaded for accepted applications' })
    }
    
    const filePath = `/uploads/applications/${application.applicationId || id}/admin-docs/${req.file.filename}`
    
    // Update the appropriate document field
    if (documentType === 'admission') {
      application.admissionDocument = {
        path: filePath,
        uploadedAt: new Date(),
        uploadedBy: req.admin.email
      }
    } else if (documentType === 'jw202') {
      application.jw202Document = {
        path: filePath,
        uploadedAt: new Date(),
        uploadedBy: req.admin.email
      }
    }
    
    await application.save()
    
    // Send email notification to student
    try {
      const populated = await Application.findById(application._id)
        .populate('student')
        .populate('scholarship')
      
      if (populated.student) {
        const emailService = (await import('../services/email.service.js')).default
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
      // Don't fail the request if email fails
    }
    
    const updated = await Application.findById(application._id)
      .populate('student')
      .populate('scholarship')
    
    res.json(updated)
  } catch (error) {
    console.error('Upload admin document error:', error)
    res.status(500).json({ error: 'Failed to upload document' })
  }
})

export default router

