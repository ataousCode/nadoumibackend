import prisma from '../config/prisma.js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

async function createAdmin() {
  try {
    const email = process.argv[2] || 'admin@nadoumi.com'
    const password = process.argv[3] || 'admin123'
    const name = process.argv[4] || 'Admin'

    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { email }
    })
    
    if (existing) {
      console.log(`⚠️  Admin with email ${email} already exists`)
      console.log(`   To update password, delete the existing admin first or use a different email`)
      process.exit(0)
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    console.log(`✅ Admin created successfully!`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Name: ${name}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()

