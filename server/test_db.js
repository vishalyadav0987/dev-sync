import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const guests = await prisma.guestSession.findMany();
  console.log("Guests:", guests.map(g => ({ id: g.id, username: g.leetcodeUsername, streak: g.currentStreak })));
  
  if (guests.length > 0) {
    const subs = await prisma.extensionSubmission.findMany({
      where: { guestId: guests[0].id }
    });
    console.log("Submissions for guest 1:", subs.length);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
