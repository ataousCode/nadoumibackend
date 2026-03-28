import prisma from '../config/prisma.js';

async function main() {
  const admin = await prisma.admin.findFirst({
    select: { id: true, name: true }
  });
  console.log(JSON.stringify(admin));
}

main().catch(console.error);
