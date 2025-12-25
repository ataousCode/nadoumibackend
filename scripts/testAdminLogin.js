// Test admin login flow exactly as the API does
import mongoose from 'mongoose'
import adminRepository from '../repositories/admin.repository.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nadoumi'

async function testLogin() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const email = 'almousleck.developer@gmail.com'
    const password = 'Almousleck97#'

    console.log(`\n🔐 Testing login with:`)
    console.log(`   Email: "${email}"`)
    console.log(`   Password: "${password}"`)

    console.log('\n📋 Step 1: Finding admin by email...')
    const admin = await adminRepository.findByEmailOrNull(email)
    
    if (!admin) {
      console.log('❌ Admin not found!')
      process.exit(1)
    }
    
    console.log(`✅ Admin found: ${admin.email}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   Has comparePassword method: ${typeof admin.comparePassword === 'function'}`)

    console.log('\n📋 Step 2: Comparing password...')
    const isValid = await admin.comparePassword(password)
    
    if (isValid) {
      console.log('✅ Password matches!')
      console.log('\n✅✅✅ LOGIN SHOULD WORK! ✅✅✅')
    } else {
      console.log('❌ Password does NOT match!')
      console.log('\n❌ This is why login fails!')
    }
    
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error during test:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testLogin()

