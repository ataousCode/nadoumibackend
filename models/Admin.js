import mongoose from 'mongoose'
import { hashPassword, comparePassword } from '../utils/password.js'

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: 'Admin'
  },
  profilePicture: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await hashPassword(this.password)
  next()
})

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return comparePassword(candidatePassword, this.password)
}

export default mongoose.model('Admin', adminSchema)

