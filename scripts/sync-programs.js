import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const universities = await prisma.university.findMany();
  console.log(`Found ${universities.length} universities to update.`);

  for (const uni of universities) {
    const majors = uni.majors;
    let count = 0;
    
    if (majors && Array.isArray(majors)) {
      count = majors.reduce((acc, cat) => acc + (cat.list?.length || 0), 0);
    }
    
    await prisma.university.update({
      where: { id: uni.id },
      data: { numberOfPrograms: count }
    });
    
    console.log(`Updated ${uni.name}: ${count} programs.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
