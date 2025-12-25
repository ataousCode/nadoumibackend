// Script to list all admins
import mongoose from 'mongoose'
import Admin from '../models/Admin.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nadoumi'

async function listAdmins() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const admins = await Admin.find({})
    
    if (admins.length === 0) {
      console.log('❌ No admins found in database')
    } else {
      console.log(`\n📋 Found ${admins.length} admin(s):\n`)
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`)
        console.log(`   Name: ${admin.name}`)
        console.log(`   ID: ${admin._id}`)
        console.log(`   Created: ${admin.createdAt}`)
        console.log(`   Profile Picture: ${admin.profilePicture || 'None'}`)
        console.log('')
      })
    }
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error listing admins:', error)
    process.exit(1)
  }
}

listAdmins()

