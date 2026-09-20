import { prisma } from "../lib/prisma.js";

export async function updateStreakAndActivity(guestId, timeSpent = 0, isSolved = false) {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  
  // 1. Update Daily Activity
  await prisma.dailyActivity.upsert({
    where: { guestId_date: { guestId, date: dateStr } },
    update: {
      timeSpent: { increment: timeSpent },
      problemsSolved: isSolved ? { increment: 1 } : undefined,
    },
    create: {
      guestId,
      date: dateStr,
      timeSpent,
      problemsSolved: isSolved ? 1 : 0,
    }
  });

  // 2. Update Streak
  // Only update streak if a problem was actually solved (meaningful activity)
  if (isSolved) {
    const guest = await prisma.guestSession.findUnique({ where: { id: guestId } });
    if (guest) {
      let { currentStreak, longestStreak, lastActiveDate } = guest;
      
      if (lastActiveDate !== dateStr) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        if (lastActiveDate === yesterdayStr) {
          currentStreak += 1;
        } else {
          currentStreak = 1; // reset streak if they missed a day
        }
        
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        lastActiveDate = dateStr;
        
        await prisma.guestSession.update({
          where: { id: guestId },
          data: { currentStreak, longestStreak, lastActiveDate }
        });
      }
    }
  }
}
