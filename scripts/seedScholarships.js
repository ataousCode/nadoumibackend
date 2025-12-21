// Script to seed dummy scholarships data
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Scholarship from '../models/Scholarship.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nadoumi'

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const count = await Scholarship.countDocuments()
    if (count > 0) {
      console.log(`ℹ️ Scholarships collection already has ${count} documents. Skipping seed.`)
      process.exit(0)
    }

    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15)
    const twoMonths = new Date(now.getFullYear(), now.getMonth() + 2, 1)
    const threeMonths = new Date(now.getFullYear(), now.getMonth() + 3, 1)

    const docs = [
      {
        title: 'Nadoumi Excellence Scholarship – Business & Trade',
        university: {
          name: 'Guangzhou International Business University',
          country: 'China',
          city: 'Guangzhou',
          website: 'https://example-business-univ.cn',
        },
        description:
          'Full-tuition scholarship for outstanding international students pursuing Bachelor or Master programs in International Trade, Supply Chain Management, or Logistics. Ideal for candidates aiming to build a career in China–Africa trade.',
        requirements: {
          minGPA: 3.0,
          requiredLanguages: ['English', 'Chinese (HSK 4 recommended)'],
          requiredDegrees: ['High School', 'Bachelor'],
        },
        benefits: {
          tuitionCoverage: 100,
          livingStipend: 2500,
          travelAllowance: true,
          healthInsurance: true,
          other: ['On-campus accommodation support', 'Mentorship from industry partners'],
        },
        applicationDeadline: nextMonth,
        startDate: twoMonths,
        duration: '4 years (Bachelor) or 2 years (Master)',
        availableSlots: 15,
        status: 'published',
        category: 'Business & Trade',
        tags: ['trade', 'logistics', 'bachelor', 'master'],
      },
      {
        title: 'Chinese Language & Culture Scholarship',
        university: {
          name: 'Nadoumi Language Institute',
          country: 'China',
          city: 'Shenzhen',
          website: 'https://example-language-institute.cn',
        },
        description:
          'One-year intensive Chinese language program with cultural immersion, ideal for students preparing for degree studies in China or careers requiring Mandarin.',
        requirements: {
          minGPA: 2.5,
          requiredLanguages: ['English'],
        },
        benefits: {
          tuitionCoverage: 80,
          livingStipend: 1500,
          travelAllowance: false,
          healthInsurance: true,
          other: ['Cultural excursions', 'Conversation partner program'],
        },
        applicationDeadline: twoMonths,
        startDate: threeMonths,
        duration: '1 academic year',
        availableSlots: 25,
        status: 'published',
        category: 'Language',
        tags: ['language', 'mandarin', 'preparatory'],
      },
      {
        title: 'STEM Innovation Scholarship',
        university: {
          name: 'Shenzhen Institute of Technology',
          country: 'China',
          city: 'Shenzhen',
          website: 'https://example-stem-univ.cn',
        },
        description:
          'Partial scholarship for high-achieving students in Computer Science, Electrical Engineering, and Data Science, with opportunities for internships in Chinese tech companies.',
        requirements: {
          minGPA: 3.3,
          requiredLanguages: ['English'],
          requiredDegrees: ['High School', 'Bachelor'],
        },
        benefits: {
          tuitionCoverage: 60,
          livingStipend: 3000,
          travelAllowance: false,
          healthInsurance: true,
          other: ['Internship placement support', 'Access to innovation labs'],
        },
        applicationDeadline: threeMonths,
        startDate: threeMonths,
        duration: '4 years',
        availableSlots: 10,
        status: 'published',
        category: 'STEM',
        tags: ['computer science', 'engineering', 'data science'],
      },
    ]

    await Scholarship.insertMany(docs)
    console.log(`✅ Seeded ${docs.length} scholarships.`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding scholarships:', error)
    process.exit(1)
  }
}

seed()


