import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const educationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  field: String,
  startDate: Date,
  endDate: Date,
  gpa: Number
}, { _id: false })

const studentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  passportNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  phone: {
    type: String,
    trim: true
  },
  profilePicture: String,
  dateOfBirth: Date,
  nationality: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    select: false
  },
  emailVerificationOTPExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  profile: {
    bio: String,
    education: [educationSchema],
    languages: [String],
    achievements: [String]
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

// Note: Password hashing is handled in the service layer for better control

// Update updatedAt before saving
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove sensitive fields from JSON output
studentSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  delete obj.emailVerificationOTP
  delete obj.emailVerificationOTPExpires
  delete obj.passwordResetToken
  delete obj.passwordResetExpires
  return obj
}

export default mongoose.model('Student', studentSchema)

