import prisma from '../config/prisma.js';

async function main() {
  const student = await prisma.student.findFirst();
  const admin = await prisma.admin.findFirst();

  if (!student || !admin) {
    console.log('No student or admin found. Please seed the database first.');
    return;
  }

  const conversation = await prisma.conversation.create({
    data: {
      studentId: student.id,
      adminId: admin.id,
      lastMessage: 'Welcome to the Registrar Office. How can we help you?',
      lastMessageAt: new Date(),
      messages: {
        create: [
          {
            senderId: admin.id,
            senderRole: 'admin',
            content: 'Hello! Welcome to Nadoumi.',
          },
          {
            senderId: admin.id,
            senderRole: 'admin',
            content: 'Welcome to the Registrar Office. How can we help you?',
          }
        ]
      }
    }
  });

  console.log(`Created conversation: ${conversation.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
