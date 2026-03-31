import prisma from "../config/prisma.js";

async function cleanupStudents(emails) {
  console.log(`🧹 Starting cleanup for: ${emails.join(", ")}`);

  try {
    for (const email of emails) {
      console.log(`\n🔍 Checking student: ${email}`);
      const student = await prisma.student.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          applications: true,
          conversations: {
            include: { messages: true },
          },
        },
      });

      if (!student) {
        console.log(`⚠️  Student ${email} not found.`);
        continue;
      }

      console.log(`✅ Found student ID: ${student.id}`);

      // 1. Delete Messages
      for (const conv of student.conversations) {
        if (conv.messages.length > 0) {
          console.log(`🗑️  Deleting ${conv.messages.length} messages...`);
          await prisma.message.deleteMany({
            where: { conversationId: conv.id },
          });
        }
      }

      // 2. Delete Conversations
      if (student.conversations.length > 0) {
        console.log(
          `🗑️  Deleting ${student.conversations.length} conversations...`,
        );
        await prisma.conversation.deleteMany({
          where: { studentId: student.id },
        });
      }

      // 3. Delete Applications
      if (student.applications.length > 0) {
        console.log(
          `🗑️  Deleting ${student.applications.length} applications...`,
        );
        await prisma.application.deleteMany({
          where: { studentId: student.id },
        });
      }

      // 4. Finally Delete Student
      await prisma.student.delete({ where: { id: student.id } });
      console.log(`✨ Successfully deleted student: ${email}`);
    }
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

const targetEmails = [
  "almousleck.developer@gmail.com",
  "microservicestech97@gmail.com",
];

cleanupStudents(targetEmails);
