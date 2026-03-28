import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("--- DIANOSTIC DATA ---");
  
  const admins = await prisma.admin.findMany({
    select: { id: true, email: true, name: true }
  });
  console.log("\nAdmins:", JSON.stringify(admins, null, 2));
  
  const students = await prisma.student.findMany({
    take: 5,
    select: { id: true, email: true, firstName: true }
  });
  console.log("\nStudents (Sample):", JSON.stringify(students, null, 2));
  
  const messages = await prisma.message.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, senderId: true, senderRole: true, status: true, content: true, conversationId: true }
  });
  console.log("\nRecent Messages:", JSON.stringify(messages, null, 2));
  
  const conversations = await prisma.conversation.findMany({
    take: 5,
    select: { id: true, studentId: true, adminId: true, lastMessage: true }
  });
  console.log("\nConversations:", JSON.stringify(conversations, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
