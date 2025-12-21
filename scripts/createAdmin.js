// Script to create an admin user
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nadoumi'

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const email = process.argv[2] || 'admin@nadoumi.com'
    const password = process.argv[3] || 'admin123'
    const name = process.argv[4] || 'Admin'

    // Check if admin already exists
    const existing = await Admin.findOne({ email })
    if (existing) {
      console.log(`⚠️  Admin with email ${email} already exists`)
      console.log(`   To update password, delete the existing admin first or use a different email`)
      process.exit(0)
    }

    // Let the Admin model's pre-save hook handle password hashing
    const admin = new Admin({
      email,
      password: password, // Will be hashed by pre('save') hook
      name
    })

    await admin.save()
    console.log(`✅ Admin created successfully!`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Name: ${name}`)
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()

