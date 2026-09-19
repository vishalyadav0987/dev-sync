import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { syncLatestSubmissionForSession } from "../services/leetcodeService.js";
import { updateStreakAndActivity } from "../services/activityService.js";

/**
 * Starts the background worker to sync LeetCode submissions.
 * Runs every 15 minutes.
 */
export function startLeetCodeSyncWorker() {
  console.log("🚀 Initializing LeetCode Background Sync Worker...");

  cron.schedule("*/15 * * * *", async () => {
    console.log(`[LeetCode Worker] 🕒 Starting sync job at ${new Date().toISOString()}`);

    try {
      // Find all sessions that have a leetcodeSession token
      // and haven't explicitly expired
      const sessions = await prisma.guestSession.findMany({
        where: {
          leetcodeSession: { not: null },
          // Optionally, filter out EXPIRED if you want them to re-auth manually first
          // leetcodeSyncStatus: { not: "EXPIRED" }
        }
      });

      console.log(`[LeetCode Worker] Found ${sessions.length} sessions to sync.`);

      // Process sequentially to avoid rate limits
      for (const session of sessions) {
        console.log(`[LeetCode Worker] Syncing session ${session.id}...`);

        try {
          // Update status to SYNCING
          await prisma.guestSession.update({
            where: { id: session.id },
            data: { leetcodeSyncStatus: "SYNCING" }
          });

          const syncResult = await syncLatestSubmissionForSession(session.leetcodeSession, session.leetcodeLastSync);

          // Update success / connected state
          await prisma.guestSession.update({
            where: { id: session.id },
            data: {
              leetcodeSyncStatus: syncResult.status, // "CONNECTED" or "EXPIRED"
              leetcodeSyncError: syncResult.status === "EXPIRED" ? syncResult.message : null,
              leetcodeLastSync: new Date()
            }
          });

          if (syncResult.problem) {
            console.log(`[LeetCode Worker] ✅ Session ${session.id} synced new problem: ${syncResult.problem.title}`);
            // Bump streak when they solved a problem on LeetCode
            await updateStreakAndActivity(session.id, 0, true);
          } else {
            console.log(`[LeetCode Worker] ℹ️ Session ${session.id}: ${syncResult.message}`);
          }
        } catch (error) {
          console.error(`[LeetCode Worker] ❌ Error syncing session ${session.id}:`, error.message);
          
          // Log error per user
          await prisma.guestSession.update({
            where: { id: session.id },
            data: {
              leetcodeSyncStatus: "ERROR",
              leetcodeSyncError: error.message || String(error),
              leetcodeLastSync: new Date()
            }
          });
        }

        // Wait 2 seconds between users to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`[LeetCode Worker] 🎉 Sync job completed.`);
    } catch (error) {
      console.error("[LeetCode Worker] Fatal error in sync job:", error);
    }
  });
}
