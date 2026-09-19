import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const guest = await prisma.guestSession.findUnique({
    where: { leetcodeUsername: 'vishalyadav0987' },
    include: {
      sessions: {
        include: { problems: true }
      },
      dailyActivities: true,
      extensionSubmissions: true
    }
  });
  console.log("Streak:", guest.currentStreak);
  console.log("DailyActivities:", guest.dailyActivities);
  console.log("Extension Submissions:", guest.extensionSubmissions.length);
  
  let solvedSessionProblems = 0;
  guest.sessions.forEach(s => {
    s.problems.forEach(p => {
      if (p.status === "SOLVED") solvedSessionProblems++;
    });
  });
  console.log("Session Problems Solved:", solvedSessionProblems);
}

main().catch(console.error).finally(() => prisma.$disconnect());
