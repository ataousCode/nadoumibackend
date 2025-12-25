// Script to check admin password
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nadoumi'

async function checkAdminPassword() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const email = process.argv[2] || 'almousleck.developer@gmail.com'
    const passwordToTest = process.argv[3] || 'Almousleck97#'

    const admin = await Admin.findOne({ email })
    
    if (!admin) {
      console.log(`❌ Admin with email ${email} not found`)
      process.exit(1)
    }

    console.log('\n📋 Admin Found:')
    console.log(`   Email: ${admin.email}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   Stored Password Hash: ${admin.password.substring(0, 30)}...`)
    console.log(`   Password Hash Length: ${admin.password.length}`)
    console.log(`   Is bcrypt hash: ${admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')}`)

    console.log(`\n🔐 Testing Password: "${passwordToTest}"`)
    
    // Test with bcrypt directly
    const directMatch = await bcrypt.compare(passwordToTest, admin.password)
    console.log(`   Direct bcrypt.compare: ${directMatch ? '✅ MATCH' : '❌ NO MATCH'}`)
    
    // Test with model method
    const modelMatch = await admin.comparePassword(passwordToTest)
    console.log(`   Model comparePassword: ${modelMatch ? '✅ MATCH' : '❌ NO MATCH'}`)

    if (!directMatch && !modelMatch) {
      console.log('\n❌ Password does NOT match!')
      console.log('\n💡 The password might not have been hashed correctly.')
      console.log('   Let me try testing if it\'s stored as plain text...')
      
      const plainTextMatch = admin.password === passwordToTest
      console.log(`   Plain text comparison: ${plainTextMatch ? '⚠️  YES - PASSWORD IS NOT HASHED!' : '❌ No'}`)
    }
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkAdminPassword()

