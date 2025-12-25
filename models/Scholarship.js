import mongoose from 'mongoose'

const universitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  city: String,
  website: String,
  logo: String,
  universityId: String
}, { _id: false })

const requirementsSchema = new mongoose.Schema({
  minGPA: Number,
  requiredLanguages: [String],
  requiredDegrees: [String],
  ageLimit: Number,
  nationalityRestrictions: [String],
  ageMin: Number,
  ageMax: Number,
  acceptStudentsBeenToChina: Boolean,
  acceptMinors: Boolean,
  acceptableLocations: [String],
  scoreRequirements: {
    gpa: Number,
    languageTest: String,
    other: String
  },
  otherRequirements: String
}, { _id: false })

const benefitsSchema = new mongoose.Schema({
  tuitionCoverage: {
    type: Number,
    min: 0,
    max: 100
  },
  livingStipend: Number,
  travelAllowance: Boolean,
  healthInsurance: Boolean,
  other: [String]
}, { _id: false })

const applicationDocumentSchema = new mongoose.Schema({
  name: String,
  description: String,
  required: Boolean,
  downloadLink: String,
  specialConditions: String
}, { _id: false })

const accommodationFeesSchema = new mongoose.Schema({
  quad: Number,
  double: Number,
  single: Number
}, { _id: false })

const feeStructureSchema = new mongoose.Schema({
  universityFees: {
    originalTuitionFee: Number,
    tuitionFeeAfterScholarship: Number,
    accommodationFees: accommodationFeesSchema,
    accommodationFeesAfterScholarship: accommodationFeesSchema,
    otherFees: [{
      name: String,
      amount: Number,
      description: String
    }]
  },
  nadoumiFees: {
    applicationFee: Number,
    serviceFee: String,
    starAgentServiceFee: Number
  }
}, { _id: false })

const scholarshipSchema = new mongoose.Schema({
  scholarshipId: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleInChinese: String,
  university: {
    type: universitySchema,
    required: true
  },
  universityRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  },
  description: {
    type: String,
    required: true
  },
  programCategory: {
    type: String,
    enum: ['Language', 'Bachelor', 'Master', 'PhD'],
    default: 'Bachelor'
  },
  field: String,
  programName: String,
  degree: String,
  duration: Number,
  intake: String,
  applicationDeadline: {
    type: Date,
    required: true
  },
  scholarshipCategory: {
    type: String,
    enum: ['Self-funded', 'Partial', 'CSC', 'Province', 'Universities', 'HSK', 'Other'],
    default: 'Partial'
  },
  scholarshipDuration: Number,
  originalTuitionFee: Number,
  tuitionFeeAfterScholarship: Number,
  accommodationFee: accommodationFeesSchema,
  accommodationFeeAfterScholarship: accommodationFeesSchema,
  scholarshipPolicy: String,
  applicantRequirements: {
    type: requirementsSchema,
    default: {}
  },
  applicationDocuments: [applicationDocumentSchema],
  additionalDocuments: [applicationDocumentSchema],
  feeStructure: feeStructureSchema,
  specialNotes: [String],
  requirements: {
    type: requirementsSchema,
    default: {}
  },
  benefits: {
    type: benefitsSchema,
    default: {}
  },
  startDate: Date,
  availableSlots: {
    type: Number,
    default: 1,
    min: 1
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'active', 'inactive'],
    default: 'draft'
  },
  category: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
})

// Update updatedAt before saving
scholarshipSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

// Indexes for performance
scholarshipSchema.index({ status: 1, applicationDeadline: 1 })
scholarshipSchema.index({ 'university.country': 1 })
scholarshipSchema.index({ category: 1 })
scholarshipSchema.index({ tags: 1 })
// scholarshipId already has unique index from schema definition (line 87-88)
scholarshipSchema.index({ programCategory: 1 })
scholarshipSchema.index({ scholarshipCategory: 1 })
scholarshipSchema.index({ universityRef: 1 })

export default mongoose.model('Scholarship', scholarshipSchema)

