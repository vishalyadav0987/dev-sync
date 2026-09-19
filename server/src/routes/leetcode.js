import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { guestIdentity } from "../middleware/guestAuth.js";
import { syncLatestSubmissionForSession } from "../services/leetcodeService.js";

const router = Router();

// GET /api/leetcode/sync/status
router.get("/sync/status", guestIdentity, async (req, res, next) => {
  try {
    const guest = await prisma.guestSession.findUnique({
      where: { id: req.guestId },
      select: {
        leetcodeSyncStatus: true,
        leetcodeLastSync: true,
        leetcodeSyncError: true,
        leetcodeSession: true
      }
    });

    if (!guest || !guest.leetcodeSession) {
      return res.json({ status: "DISCONNECTED", message: "Not connected to LeetCode." });
    }

    res.json({
      status: guest.leetcodeSyncStatus,
      lastSync: guest.leetcodeLastSync,
      error: guest.leetcodeSyncError
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/leetcode/sync
router.post("/sync", guestIdentity, async (req, res, next) => {
  try {
    const { leetcodeSession } = req.body;
    if (!leetcodeSession) {
      return res.status(400).json({ error: "LeetCode session cookie is required." });
    }

    // Attempt the sync
    let syncResult;
    try {
      syncResult = await syncLatestSubmissionForSession(leetcodeSession);
    } catch (error) {
      // Record failure
      await prisma.guestSession.update({
        where: { id: req.guestId },
        data: {
          leetcodeSession,
          leetcodeSyncStatus: "EXPIRED", // Or ERROR
          leetcodeSyncError: error.message || String(error),
          leetcodeLastSync: new Date()
        }
      });
      return res.status(500).json({ error: error.message || "Sync failed" });
    }

    // Success or valid EXPIRED response from service
    await prisma.guestSession.update({
      where: { id: req.guestId },
      data: {
        leetcodeSession,
        leetcodeSyncStatus: syncResult.status,
        leetcodeSyncError: syncResult.status === "EXPIRED" ? syncResult.message : null,
        leetcodeLastSync: new Date()
      }
    });

    if (syncResult.status === "EXPIRED") {
      return res.status(401).json({ error: syncResult.message });
    }

    res.json({
      message: syncResult.message,
      problem: syncResult.problem,
      syncedCount: syncResult.syncedCount || 0,
      failedCount: syncResult.failedCount || 0,
      errors: syncResult.errors
    });
  } catch (err) {
    next(err);
  }
});

export default router;
