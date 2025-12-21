import mongoose from 'mongoose'

const rankingSchema = new mongoose.Schema({
  name: String,
  value: String,
  icon: String
}, { _id: false })

const albumSchema = new mongoose.Schema({
  title: String,
  images: [String]
}, { _id: false })

const universitySchema = new mongoose.Schema({
  universityId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  nameInChinese: String,
  logo: String,
  bannerImage: String,
  city: String,
  province: String,
  type: {
    type: String,
    enum: ['Public', 'Private'],
    default: 'Public'
  },
  foundedYear: Number,
  totalStudents: Number,
  internationalStudents: Number,
  facultyCount: Number,
  numberOfPrograms: {
    type: Number,
    default: 0
  },
  description: String,
  advantages: [String],
  albums: [albumSchema],
  rankings: [rankingSchema],
  programs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship'
  }],
  scholarships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

universitySchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

universitySchema.index({ universityId: 1 })
universitySchema.index({ name: 1 })
universitySchema.index({ city: 1, province: 1 })
universitySchema.index({ status: 1 })

export default mongoose.model('University', universitySchema)

