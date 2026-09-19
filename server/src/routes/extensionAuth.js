import crypto from "crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { guestIdentity } from "../middleware/guestAuth.js";
import { updateStreakAndActivity } from "../services/activityService.js";

const router = Router();

// ── Extension / Website connects via LeetCode ───────────────────────────────────
// POST /api/leetcode/extension/connect
// Called by the Chrome Extension background.js. Creates or finds the guest account
// based solely on the leetcodeUsername.
router.post("/connect", async (req, res, next) => {
  try {
    const { leetcodeUsername } = req.body;
    if (!leetcodeUsername) {
      return res.status(400).json({ error: "leetcodeUsername is required." });
    }

    let guest = await prisma.guestSession.findUnique({
      where: { leetcodeUsername }
    });

    if (!guest) {
      guest = await prisma.guestSession.create({
        data: {
          leetcodeUsername,
          displayName: leetcodeUsername,
          extensionConnected: true
        }
      });
    } else {
      await prisma.guestSession.update({
        where: { id: guest.id },
        data: { extensionConnected: true }
      });
    }

    res.json({ success: true, guestId: guest.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/leetcode/extension/login
// Called by the DevPortfolio website to log into an existing LeetCode session.
router.post("/login", async (req, res, next) => {
  try {
    const { leetcodeUsername } = req.body;
    if (!leetcodeUsername) {
      return res.status(400).json({ error: "leetcodeUsername is required." });
    }

    let guest = await prisma.guestSession.findUnique({
      where: { leetcodeUsername }
    });

    if (!guest) {
      guest = await prisma.guestSession.create({
        data: {
          leetcodeUsername,
          displayName: leetcodeUsername
        }
      });
    }

    res.json({ success: true, guestId: guest.id });
  } catch (err) {
    next(err);
  }
});

// ── Extension status ────────────────────────────────────────────
// GET /api/leetcode/extension/status
// Called by the website to check if the extension is connected.
router.get("/status", guestIdentity, async (req, res, next) => {
  try {
    const guest = await prisma.guestSession.findUnique({
      where: { id: req.guestId },
      select: { extensionConnected: true },
    });

    res.json({
      connected: guest?.extensionConnected || false,
    });
  } catch (err) {
    next(err);
  }
});

// ── Receive a submission from the extension ─────────────────────
// POST /api/leetcode/extension/submission
// Called by the Chrome Extension background.js when an Accepted
// submission is detected on LeetCode.
router.post("/submission", async (req, res, next) => {
  try {
    const guestId = req.header("x-extension-guest-id");
    if (!guestId) {
      return res.status(401).json({ error: "Missing x-extension-guest-id header." });
    }

    // Verify the extension is actually connected for this guest
    const guest = await prisma.guestSession.findUnique({
      where: { id: guestId },
      select: { id: true, extensionConnected: true },
    });

    if (!guest || !guest.extensionConnected) {
      return res.status(403).json({ error: "Extension is not connected for this user." });
    }

    const { submissionId, problemSlug, problemTitle, language, code } = req.body;

    if (!submissionId || !problemSlug || !problemTitle || !language) {
      return res.status(400).json({
        error: "Missing required fields: submissionId, problemSlug, problemTitle, language.",
      });
    }

    // Deduplicate — unique constraint on [guestId, leetcodeSubmissionId]
    const existing = await prisma.extensionSubmission.findUnique({
      where: {
        guestId_leetcodeSubmissionId: {
          guestId: guest.id,
          leetcodeSubmissionId: String(submissionId),
        },
      },
    });

    if (existing) {
      return res.json({ success: true, duplicate: true, submissionId: existing.id });
    }

    const submission = await prisma.extensionSubmission.create({
      data: {
        guestId: guest.id,
        leetcodeSubmissionId: String(submissionId),
        problemSlug,
        problemTitle,
        language,
        code: code || "",
        status: "RECEIVED",
      },
    });

    console.log(`[Extension] ✅ Received submission: "${problemTitle}" (${problemSlug}) from guest ${guest.id}`);

    // Process the submission immediately to create a Problem or ProblemApproach
    try {
      const existingProblem = await prisma.problem.findUnique({
        where: { slug: problemSlug },
        include: { approaches: true }
      });

      if (existingProblem) {
        console.log(`[Extension] 🔄 Problem exists. Appending new approach for "${problemTitle}"...`);
        const solveDate = new Date().toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        });

        await prisma.problemApproach.create({
          data: {
            problemId: existingProblem.id,
            title: `Solved on ${solveDate}`,
            cppCode: code || "",
            timeComplexity: "",
            spaceComplexity: "",
            approachNotes: `Automatically synced from LeetCode extension.`,
            visualHtml: "",
            order: existingProblem.approaches.length
          }
        });

        await prisma.extensionSubmission.update({
          where: { id: submission.id },
          data: { status: "PROCESSED" }
        });

        await updateStreakAndActivity(guest.id, 0, true);

      } else {
        console.log(`[Extension] ✨ New problem. Creating new entry for "${problemTitle}"...`);

        // Dynamic import to avoid circular dependencies or if it's large
        const { analyzeProblemWithGemini } = await import("../services/gemini.js");
        const analysis = await analyzeProblemWithGemini({
          title: problemTitle,
          code: code || ""
        });

        const categoryName = analysis.primaryCategory || "Uncategorized";
        const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
        if (!category) {
          category = await prisma.category.create({
            data: { name: categoryName, slug: categorySlug, order: 99 }
          });
        }

        await prisma.problem.create({
          data: {
            title: problemTitle,
            slug: problemSlug,
            difficulty: "MEDIUM",
            cppCode: code || "",
            language: language,
            edgeCases: analysis.edgeCases || [],
            approachNotes: analysis.approachNotes || "",
            timeComplexity: analysis.timeComplexity || "",
            spaceComplexity: analysis.spaceComplexity || "",
            tags: analysis.tags || [],
            statement: analysis.statement || "",
            visualHtml: analysis.visualHtml || null,
            categoryId: category.id,
            leetcodeUrl: `https://leetcode.com/problems/${problemSlug}`,
          }
        });

        await prisma.extensionSubmission.update({
          where: { id: submission.id },
          data: { status: "PROCESSED" }
        });

        await updateStreakAndActivity(guest.id, 0, true);
      }
    } catch (processError) {
      console.error("[Extension] ❌ Error processing extension submission:", processError);
      await prisma.extensionSubmission.update({
        where: { id: submission.id },
        data: { status: "FAILED" }
      });
    }

    // Emit real-time event so the frontend can react
    const io = req.app.get("io");
    if (io) {
      io.to(guest.id).emit("leetcode:submission", {
        submissionId: submission.id,
        problemSlug,
        problemTitle,
        language,
      });
    }

    res.json({ success: true, submissionId: submission.id });
  } catch (err) {
    // Handle unique constraint violation gracefully
    if (err.code === "P2002") {
      return res.json({ success: true, duplicate: true });
    }
    next(err);
  }
});

// ── Disconnect extension ────────────────────────────────────────
// POST /api/leetcode/extension/disconnect
// Called by the website to unlink the Chrome Extension.
router.post("/disconnect", guestIdentity, async (req, res, next) => {
  try {
    await prisma.guestSession.update({
      where: { id: req.guestId },
      data: {
        extensionConnected: false,
        extensionToken: null,
        extensionTokenExpiry: null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Get Extension Stats ──────────────────────────────────────────
// GET /api/leetcode/extension/stats
router.get("/stats", async (req, res, next) => {
  try {
    const guestId = req.headers["x-extension-guest-id"];
    if (!guestId) return res.status(401).json({ error: "No guest ID provided" });

    const guest = await prisma.guestSession.findUnique({
      where: { id: guestId },
    });

    if (!guest) return res.status(404).json({ error: "Guest session not found" });

    // 1. Calculate platform-wide problem stats (not just what the user solved)
    const problems = await prisma.problem.findMany({
      include: { category: true }
    });

    const stats = {
      total: problems.length,
      easy: 0,
      medium: 0,
      hard: 0
    };

    const categoryMap = {};

    problems.forEach((prob) => {
      // Difficulty counts
      if (prob.difficulty === "EASY") stats.easy++;
      else if (prob.difficulty === "MEDIUM") stats.medium++;
      else if (prob.difficulty === "HARD") stats.hard++;

      // Category counts
      const catName = prob.category ? prob.category.name : "Uncategorized";
      if (!categoryMap[catName]) {
        categoryMap[catName] = 0;
      }
      categoryMap[catName]++;
    });

    const categories = Object.keys(categoryMap).map(name => ({
      name,
      count: categoryMap[name]
    })).sort((a, b) => b.count - a.count);

    // 2. Weekly activity array (T W T F S S M)
    // We still want this to represent the specific user's activity
    const submissions = await prisma.extensionSubmission.findMany({
      where: { guestId, status: "PROCESSED" },
    });
    const weeklyActivity = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const hasSubmission = submissions.some(sub => {
        const subTime = sub.createdAt.getTime();
        return subTime >= dayStart && subTime < dayEnd;
      });

      weeklyActivity.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        active: hasSubmission,
        date: d.toISOString()
      });
    }

    res.json({
      success: true,
      stats,
      categories,
      weeklyActivity,
      currentStreak: guest.currentStreak || 0,
      longestStreak: guest.longestStreak || 0
    });

  } catch (err) {
    next(err);
  }
});

export default router;
