import mongoose from 'mongoose'

const statusHistorySchema = new mongoose.Schema({
  status: String,
  timestamp: Date,
  note: String,
  adminEmail: String,
  metadata: mongoose.Schema.Types.Mixed
})

const preferencesSchema = new mongoose.Schema({
  preferredStartDate: Date,
  additionalNotes: String,
  priority: {
    type: Number,
    min: 1,
    max: 5
  }
}, { _id: false })

const documentsSchema = new mongoose.Schema({
  // Legacy fields for backward compatibility
  resume: String,
  transcripts: [String],
  recommendationLetters: [String],
  languageCertificates: [String],
  other: [String],
  // New required documents
  passportIdPage: String,
  passportPhoto: String,
  academicTranscript: String,
  highestDegreeDiploma: String,
  physicalExaminationForm: String,
  nonCriminalRecord: String,
  englishProficiency: String,
  bankStatement: String,
  studyPlan: String,
  selfIntroductionVideo: String,
}, { _id: false })

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  scholarship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true
  },
  // Legacy fields for backward compatibility
  id: String,
  applicant: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    nationality: String,
    dateOfBirth: Date
  },
  fields: mongoose.Schema.Types.Mixed,
  personalInfo: mongoose.Schema.Types.Mixed,
  contactInfo: mongoose.Schema.Types.Mixed,
  familyInfo: mongoose.Schema.Types.Mixed,
  // New structured fields
  preferences: {
    type: preferencesSchema,
    default: {}
  },
  documents: {
    type: documentsSchema,
    default: {}
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'received', 'under_review', 'interview', 'interview_passed', 'interview_failed', 'accepted', 'rejected', 'revoked', 'waitlisted']
  },
  statusHistory: [statusHistorySchema],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  interviewDetails: mongoose.Schema.Types.Mixed,
  rejectionDetails: mongoose.Schema.Types.Mixed,
  acceptedAt: Date,
  // Documents uploaded by admin after acceptance
  admissionDocument: {
    path: String,
    uploadedAt: Date,
    uploadedBy: String // admin email
  },
  jw202Document: {
    path: String,
    uploadedAt: Date,
    uploadedBy: String // admin email
  }
})

// Indexes for performance
applicationSchema.index({ student: 1, submittedAt: -1 })
applicationSchema.index({ scholarship: 1, status: 1 })
applicationSchema.index({ status: 1, submittedAt: -1 })

// Update updatedAt before saving
applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

export default mongoose.model('Application', applicationSchema)

