import prisma from "../config/prisma.js";

async function diagNotifications() {
  console.log("🔍 Checking recent notifications...");
  
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (notifications.length === 0) {
      console.log("❌ No notifications found in database.");
      return;
    }

    notifications.forEach(n => {
      console.log(`\n📧 Notification ${n.id}`);
      console.log(`   To: ${n.recipient}`);
      console.log(`   Status: ${n.status}`);
      console.log(`   Type: ${n.template}`);
      if (n.error) console.log(`   ❌ Error: ${n.error}`);
      console.log(`   Created: ${n.createdAt.toISOString()}`);
      if (n.sentAt) console.log(`   Sent: ${n.sentAt.toISOString()}`);
    });

  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

diagNotifications();
