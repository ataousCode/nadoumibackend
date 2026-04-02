import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  const universityCount = await prisma.university.count();
  const topUniversities = await prisma.university.count({ where: { isTop: true } });
  const recommendedUniversities = await prisma.university.count({ where: { isRecommended: true } });
  const partnerUniversities = await prisma.university.count({ where: { isPartner: true } });
  const activeUniversities = await prisma.university.count({ where: { status: 'active' } });

  const scholarshipCount = await prisma.scholarship.count();
  const topScholarships = await prisma.scholarship.count({ where: { isTop: true } });
  const publishedScholarships = await prisma.scholarship.count({ where: { status: 'published' } });
  const recommendedScholarships = await prisma.scholarship.count({ where: { isRecommended: true } });

  console.log('--- University Stats ---');
  console.log('Total:', universityCount);
  console.log('Top:', topUniversities);
  console.log('Recommended:', recommendedUniversities);
  console.log('Partner:', partnerUniversities);
  console.log('Active Status:', activeUniversities);

  console.log('\n--- Scholarship Stats ---');
  console.log('Total:', scholarshipCount);
  console.log('Top:', topScholarships);
  console.log('Recommended:', recommendedScholarships);
  console.log('Published Status:', publishedScholarships);

  await prisma.$disconnect();
}

checkData();
