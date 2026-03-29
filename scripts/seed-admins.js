import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const admins = [
  {
    email: 'almouslecka@gmail.com',
    password: 'Almousleck97#',
    name: 'Almousleck',
  },
  {
    email: 'team@nadoumiconsulting.com',
    password: 'Nadoumi2025#',
    name: 'Nadoumi Team',
  },
];

async function main() {
  console.log('🚀 Starting admin seeding...');

  for (const admin of admins) {
    const existing = await prisma.admin.findUnique({
      where: { email: admin.email },
    });

    if (existing) {
      console.log(`⚠️ Admin ${admin.email} already exists. Skipping.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(admin.password, 12);

    await prisma.admin.create({
      data: {
        email: admin.email,
        password: hashedPassword,
        name: admin.name,
        role: 'admin',
      },
    });

    console.log(`✅ Admin ${admin.email} created successfully.`);
  }

  console.log('✨ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admins:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
