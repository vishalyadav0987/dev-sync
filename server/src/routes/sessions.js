import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { guestIdentity } from "../middleware/guestAuth.js";
import { updateStreakAndActivity } from "../services/activityService.js";

const router = Router();
router.use(guestIdentity); // every route here is scoped to the calling guest

const emit = (req, event, payload) => {
  const io = req.app.get("io");
  if (io) io.to(req.guestId).emit(event, payload);
};

// Append-only activity log — powers the session timeline and cross-session insights.
async function logActivity(sessionId, guestId, type, metadata) {
  return prisma.sessionActivity.create({ data: { sessionId, guestId, type, metadata } });
}

function getEffectiveStreak(guest) {
  let streak = guest?.currentStreak || 0;
  const lastActiveDate = guest?.lastActiveDate;
  if (lastActiveDate) {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (lastActiveDate !== dateStr && lastActiveDate !== yesterdayStr) {
      streak = 0;
    }
  }
  return streak;
}

const STAGE_ORDER = ["understanding", "approach", "implementation", "testing", "solved"];

// Resolve a problem id or slug -> problem row (so the "add to session" flow
// from the DSA Showcase page can pass either).
async function resolveProblem(idOrSlug) {
  let problem = await prisma.problem.findUnique({ where: { id: idOrSlug } }).catch(() => null);
  if (problem) return problem;
  return prisma.problem.findUnique({ where: { slug: idOrSlug } }).catch(() => null);
}

function deriveProgress(session) {
  const total = session.problems?.length ?? 0;
  const solved = session.problems?.filter((p) => p.status === "SOLVED").length ?? 0;
  const inProgress = session.problems?.filter((p) => p.status === "IN_PROGRESS").length ?? 0;
  const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
  return { total, solved, inProgress, remaining: total - solved, percent };
}

// "Continue where you left off": the most recently touched in-progress
// problem, falling back to the first not-started one.
function deriveContinue(session) {
  const problems = session.problems ?? [];
  const inProgress = problems
    .filter((p) => p.status === "IN_PROGRESS")
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
  if (inProgress) return { problem: inProgress, reason: "in_progress" };

  const notStarted = problems
    .filter((p) => p.status === "NOT_STARTED")
    .sort((a, b) => a.order - b.order)[0];
  if (notStarted) return { problem: notStarted, reason: "not_started" };

  return null;
}

const sessionCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  category: z.string().max(80).optional(),
  goalLabel: z.string().max(200).optional(),
  targetProblems: z.number().int().min(0).max(200).optional(),
  targetMinutes: z.number().int().min(0).max(1000).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "MIXED"]).optional(),
  focusMode: z.boolean().optional(),
  problemIds: z.array(z.string()).optional(), // optional initial queue (e.g. from a Quick Start template)
});

const sessionUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  goalLabel: z.string().max(200).nullable().optional(),
  targetProblems: z.number().int().min(0).max(200).nullable().optional(),
  targetMinutes: z.number().int().min(0).max(1000).nullable().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "MIXED"]).optional(),
  focusMode: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  addFocusedSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(), // increment only, never overwritten by client
});

// GET /api/sessions/stats — very lightweight endpoint for Header
router.get("/sessions/stats", async (req, res, next) => {
  try {
    const guest = await prisma.guestSession.findUnique({
      where: { id: req.guestId },
      select: { currentStreak: true, longestStreak: true, lastActiveDate: true },
    });
    res.json({
      streak: getEffectiveStreak(guest),
      longestStreak: guest?.longestStreak || 0,
      lastActiveDate: guest?.lastActiveDate || null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions — this guest's study sessions, lightweight (list view)
router.get("/sessions", async (req, res, next) => {
  try {
    const { status } = req.query;
    const sessions = await prisma.studySession.findMany({
      where: { guestId: req.guestId, ...(status ? { status } : {}) },
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
      include: {
        _count: { select: { notes: true, problems: true } },
        problems: { select: { status: true } },
      },
    });

    const shaped = sessions.map((s) => {
      const { problems, ...rest } = s;
      return { ...rest, progress: deriveProgress({ problems }) };
    });

    res.json(shaped);
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions — create a new session (optionally pre-seeded with problems, e.g. from a Quick Start template)
router.post("/sessions", async (req, res, next) => {
  try {
    const data = sessionCreateSchema.parse(req.body);
    const { problemIds = [], ...sessionFields } = data;

    const session = await prisma.studySession.create({
      data: {
        ...sessionFields,
        guestId: req.guestId,
        problems: problemIds.length
          ? { create: problemIds.map((problemId, i) => ({ problemId, order: i })) }
          : undefined,
      },
      include: { problems: { include: { problem: true } }, notes: true },
    });

    await logActivity(session.id, req.guestId, "SESSION_STARTED", { title: session.title });
    emit(req, "session:updated", { action: "created", sessionId: session.id });
    res.status(201).json(session);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Cross-session insights: "Today's Momentum" + recommended next actions ──
// Registered before /sessions/:id so "insights" is never swallowed as an :id.
router.get("/sessions/insights", async (req, res, next) => {
  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const [todaysActivity, allSessions, unresolvedMistakes, guest] = await Promise.all([
      prisma.sessionActivity.findMany({ where: { guestId: req.guestId, createdAt: { gte: since } } }),
      prisma.studySession.findMany({
        where: { guestId: req.guestId },
        include: { problems: true },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
      prisma.mistakeReview.count({ where: { guestId: req.guestId, isReviewed: false } }),
      prisma.guestSession.findUnique({ where: { id: req.guestId }, select: { currentStreak: true, longestStreak: true, lastActiveDate: true } }),
    ]);

    const solvedToday = todaysActivity.filter((a) => a.type === "PROBLEM_SOLVED").length;
    const failedToday = todaysActivity.filter((a) => a.type === "PROBLEM_FAILED").length;
    const attemptedToday = solvedToday + failedToday;
    const focusSecondsToday = allSessions
      .filter((s) => s.updatedAt >= since)
      .reduce((sum, s) => sum + s.totalFocusedSeconds, 0);

    // DB Streak takes priority
    const streak = getEffectiveStreak(guest);
    const longestStreak = guest?.longestStreak || 0;

    // Rule-based recommendations.
    const recommendations = [];
    const failCounts = {};
    for (const s of allSessions) {
      for (const p of s.problems) {
        if (p.status === "FAILED") failCounts[p.problemId] = (failCounts[p.problemId] || 0) + 1;
      }
    }
    const repeatedFailures = Object.entries(failCounts).filter(([, count]) => count >= 2);
    if (repeatedFailures.length) {
      recommendations.push({ type: "retry_failed", label: "Retry a problem you've failed more than once" });
    }
    if (unresolvedMistakes > 0) {
      recommendations.push({ type: "review_mistakes", label: `Review ${unresolvedMistakes} unresolved mistake${unresolvedMistakes > 1 ? "s" : ""}` });
    }
    const almostDone = allSessions.find(
      (s) => s.status === "ACTIVE" && s.targetProblems && s.problems.filter((p) => p.status === "SOLVED").length === s.targetProblems - 1
    );
    if (almostDone) {
      recommendations.push({ type: "finish_goal", label: `One more problem to finish "${almostDone.title}"`, sessionId: almostDone.id });
    }
    if (!recommendations.length) {
      recommendations.push({ type: "start_session", label: "Start a focused session to get personalized recommendations" });
    }

    res.json({
      today: {
        solved: solvedToday,
        focusSeconds: focusSecondsToday,
        successRate: attemptedToday > 0 ? Math.round((solvedToday / attemptedToday) * 100) : null,
        streak,
        longestStreak,
      },
      recommendations,
      unresolvedMistakes,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id — full session detail: problems (ordered), notes, derived progress/continue state
router.get("/sessions/:id", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: { id: req.params.id, guestId: req.guestId },
      include: {
        problems: {
          orderBy: { order: "asc" },
          include: {
            problem: { select: { id: true, title: true, slug: true, difficulty: true, tags: true } },
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { problem: { select: { title: true, slug: true } } },
        },
        mistakes: {
          orderBy: { createdAt: "desc" },
          include: { problem: { select: { title: true, slug: true } } },
        },
        activity: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json({
      ...session,
      progress: deriveProgress(session),
      continueState: deriveContinue(session),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sessions/:id — rename, favorite, archive, edit goal/config, accumulate focused time
router.patch("/sessions/:id", async (req, res, next) => {
  try {
    const existing = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!existing) return res.status(404).json({ error: "Session not found" });

    const data = sessionUpdateSchema.parse(req.body);
    const { addFocusedSeconds, status, ...rest } = data;

    const session = await prisma.studySession.update({
      where: { id: existing.id },
      data: {
        ...rest,
        ...(status ? { status, completedAt: status === "COMPLETED" ? new Date() : existing.completedAt } : {}),
        ...(addFocusedSeconds ? { totalFocusedSeconds: { increment: addFocusedSeconds } } : {}),
      },
    });

    emit(req, "session:updated", { action: "updated", sessionId: session.id });
    res.json(session);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/sessions/:id — archives by default; ?permanent=true hard-deletes
router.delete("/sessions/:id", async (req, res, next) => {
  try {
    const existing = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!existing) return res.status(404).json({ error: "Session not found" });

    if (req.query.permanent === "true") {
      await prisma.studySession.delete({ where: { id: existing.id } });
      emit(req, "session:updated", { action: "deleted", sessionId: existing.id });
      return res.json({ success: true, deleted: true });
    }

    const session = await prisma.studySession.update({ where: { id: existing.id }, data: { status: "ARCHIVED" } });
    emit(req, "session:updated", { action: "archived", sessionId: session.id });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/:id/restore — bring an archived session back to ACTIVE
router.post("/sessions/:id/restore", async (req, res, next) => {
  try {
    const existing = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!existing) return res.status(404).json({ error: "Session not found" });
    const session = await prisma.studySession.update({ where: { id: existing.id }, data: { status: "ACTIVE" } });
    emit(req, "session:updated", { action: "restored", sessionId: session.id });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/:id/duplicate — { copyNotes?: boolean, title?: string }
router.post("/sessions/:id/duplicate", async (req, res, next) => {
  try {
    const source = await prisma.studySession.findFirst({
      where: { id: req.params.id, guestId: req.guestId },
      include: { problems: true, notes: true },
    });
    if (!source) return res.status(404).json({ error: "Session not found" });

    const copyNotes = Boolean(req.body?.copyNotes);
    const title = (req.body?.title || `${source.title} (Copy)`).slice(0, 120);

    const duplicate = await prisma.studySession.create({
      data: {
        title,
        description: source.description,
        category: source.category,
        goalLabel: source.goalLabel,
        targetProblems: source.targetProblems,
        targetMinutes: source.targetMinutes,
        difficulty: source.difficulty,
        focusMode: source.focusMode,
        guestId: req.guestId,
        problems: {
          create: source.problems.map((p) => ({ problemId: p.problemId, order: p.order, status: "NOT_STARTED" })),
        },
        notes: copyNotes
          ? {
              create: source.notes.map((n) => ({
                title: n.title,
                content: n.content,
                problemId: n.problemId,
                color: n.color,
                tags: n.tags,
                guestId: req.guestId,
              })),
            }
          : undefined,
      },
    });

    emit(req, "session:updated", { action: "created", sessionId: duplicate.id });
    res.status(201).json(duplicate);
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id/notes?tag=mistake — session-scoped notes, optionally filtered by tag
router.get("/sessions/:id/notes", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { tag } = req.query;
    const notes = await prisma.note.findMany({
      where: {
        sessionId: session.id,
        guestId: req.guestId,
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { problem: { select: { title: true, slug: true } } },
    });
    res.json({ notes });
  } catch (err) {
    next(err);
  }
});

// ── Session problem queue ──────────────────────────────────────

// POST /api/sessions/:id/problems — add one or more problems { problemId } or { problemIds: [] }
router.post("/sessions/:id/problems", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: { id: req.params.id, guestId: req.guestId },
      include: { problems: true },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const ids = req.body.problemIds || (req.body.problemId ? [req.body.problemId] : []);
    if (!ids.length) return res.status(400).json({ error: "problemId or problemIds required" });

    const resolved = await Promise.all(ids.map(resolveProblem));
    const valid = resolved.filter(Boolean);
    if (!valid.length) return res.status(404).json({ error: "No matching problems found" });

    const existingIds = new Set(session.problems.map((p) => p.problemId));
    let order = session.problems.length;
    const toCreate = valid.filter((p) => !existingIds.has(p.id)).map((p) => ({ problemId: p.id, order: order++ }));

    if (toCreate.length) {
      await prisma.sessionProblem.createMany({ data: toCreate.map((c) => ({ ...c, sessionId: session.id })) });
    }

    const updated = await prisma.sessionProblem.findMany({
      where: { sessionId: session.id },
      orderBy: { order: "asc" },
      include: { problem: { select: { title: true, slug: true, difficulty: true } } },
    });

    emit(req, "session:updated", { action: "problems_added", sessionId: session.id });
    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sessions/:id/problems/:problemId — update status / order / timeSpent
router.patch("/sessions/:id/problems/:problemId", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const schema = z.object({
      status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SOLVED", "FAILED", "REVISIT"]).optional(),
      order: z.number().int().min(0).optional(),
      addTimeSpent: z.number().int().min(0).max(24 * 60 * 60).optional(),
    });
    const data = schema.parse(req.body);
    const { addTimeSpent, status, ...rest } = data;

    const now = new Date();
    const statusTiming =
      status === "IN_PROGRESS" ? { startedAt: now } : status === "SOLVED" || status === "FAILED" ? { completedAt: now } : {};

    const sessionProblem = await prisma.sessionProblem.update({
      where: { sessionId_problemId: { sessionId: session.id, problemId: req.params.problemId } },
      data: {
        ...rest,
        ...(status ? { status, ...statusTiming } : {}),
        ...(addTimeSpent ? { timeSpent: { increment: addTimeSpent } } : {}),
      },
    });

    // If every problem in the session is now solved, mark the session complete automatically.
    if (status === "SOLVED") {
      const remaining = await prisma.sessionProblem.count({
        where: { sessionId: session.id, status: { not: "SOLVED" } },
      });
      if (remaining === 0) {
        await prisma.studySession.update({ where: { id: session.id }, data: { status: "COMPLETED", completedAt: now } });
      }
    }

    emit(req, "session:updated", { action: "problem_updated", sessionId: session.id });
    res.json(sessionProblem);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/sessions/:id/problems/:problemId — remove from the queue
router.delete("/sessions/:id/problems/:problemId", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    await prisma.sessionProblem.delete({
      where: { sessionId_problemId: { sessionId: session.id, problemId: req.params.problemId } },
    });

    emit(req, "session:updated", { action: "problem_removed", sessionId: session.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sessions/:id/problems-reorder — { order: [problemId, problemId, ...] } drag-and-drop persistence
router.patch("/sessions/:id/problems-reorder", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const order = z.array(z.string()).parse(req.body.order);
    await prisma.$transaction(
      order.map((problemId, index) =>
        prisma.sessionProblem.update({
          where: { sessionId_problemId: { sessionId: session.id, problemId } },
          data: { order: index },
        })
      )
    );

    emit(req, "session:updated", { action: "problems_reordered", sessionId: session.id });
    res.json({ success: true });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Session lifecycle (start / pause / resume / complete) ─────────
// These are thin wrappers around status + activity logging. Focus-time
// accounting itself stays client-timestamp-based (see useSessionTimer) and is
// flushed via PATCH /sessions/:id { addFocusedSeconds }; these endpoints exist
// so the timeline and cross-session insights have real lifecycle events.

router.post("/sessions/:id/start", async (req, res, next) => {
  try {
    const existing = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!existing) return res.status(404).json({ error: "Session not found" });

    const session = await prisma.studySession.update({
      where: { id: existing.id },
      data: { status: "ACTIVE" },
    });
    await logActivity(session.id, req.guestId, "SESSION_STARTED", {});
    emit(req, "session:updated", { action: "started", sessionId: session.id });
    res.json(session);
  } catch (err) {
    next(err);
  }
});

router.post("/sessions/:id/pause", async (req, res, next) => {
  try {
    const existing = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!existing) return res.status(404).json({ error: "Session not found" });

    await logActivity(existing.id, req.guestId, "SESSION_PAUSED", {});
    emit(req, "session:updated", { action: "paused", sessionId: existing.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/sessions/:id/resume", async (req, res, next) => {
  try {
    const existing = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!existing) return res.status(404).json({ error: "Session not found" });

    await logActivity(existing.id, req.guestId, "SESSION_RESUMED", {});
    emit(req, "session:updated", { action: "resumed", sessionId: existing.id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

const completeSchema = z.object({
  reflection: z.string().max(4000).optional(),
  confidence: z.number().int().min(1).max(5).optional(),
  revisitProblemIds: z.array(z.string()).optional(), // problems to flag REVISIT on completion
});

// POST /api/sessions/:id/complete — closes out the session and returns a
// server-computed completion summary (never trust client-provided stats).
router.post("/sessions/:id/complete", async (req, res, next) => {
  try {
    const existing = await prisma.studySession.findFirst({
      where: { id: req.params.id, guestId: req.guestId },
      include: { problems: { include: { problem: { select: { title: true, slug: true, difficulty: true } } } } },
    });
    if (!existing) return res.status(404).json({ error: "Session not found" });

    const { reflection, confidence, revisitProblemIds = [] } = completeSchema.parse(req.body);
    const now = new Date();

    if (revisitProblemIds.length) {
      await prisma.sessionProblem.updateMany({
        where: { sessionId: existing.id, problemId: { in: revisitProblemIds } },
        data: { status: "REVISIT" },
      });
    }

    const session = await prisma.studySession.update({
      where: { id: existing.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        reflection: reflection ?? existing.reflection,
        confidence: confidence ?? existing.confidence,
      },
      include: { problems: { include: { problem: { select: { title: true, slug: true, difficulty: true } } } } },
    });

    const solved = session.problems.filter((p) => p.status === "SOLVED");
    const failed = session.problems.filter((p) => p.status === "FAILED");
    const attemptedCount = solved.length + failed.length;
    const completionPercent = session.targetProblems
      ? Math.min(100, Math.round((solved.length / session.targetProblems) * 100))
      : session.problems.length
      ? Math.round((solved.length / session.problems.length) * 100)
      : 0;
    const successRate = attemptedCount > 0 ? Math.round((solved.length / attemptedCount) * 100) : null;

    await logActivity(session.id, req.guestId, "SESSION_COMPLETED", {
      solved: solved.length,
      total: session.problems.length,
      focusMinutes: Math.round(session.totalFocusedSeconds / 60),
    });
    emit(req, "session:updated", { action: "completed", sessionId: session.id });

    res.json({
      session,
      summary: {
        plannedMinutes: session.targetMinutes,
        actualMinutes: Math.round(session.totalFocusedSeconds / 60),
        plannedProblems: session.targetProblems,
        completedProblems: solved.length,
        completionPercent,
        successRate,
        problems: session.problems.map((p) => ({
          id: p.problemId,
          title: p.problem.title,
          slug: p.problem.slug,
          status: p.status,
        })),
      },
    });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Problem solving lifecycle (queue-item level) ───────────────────
// Wraps the generic PATCH with intent-named actions + activity logging, so
// the frontend workspace doesn't have to know status-transition rules.

router.post("/sessions/:id/problems/:problemId/start", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const now = new Date();
    const sessionProblem = await prisma.sessionProblem.update({
      where: { sessionId_problemId: { sessionId: session.id, problemId: req.params.problemId } },
      data: { status: "IN_PROGRESS", stage: "understanding", startedAt: now },
    });
    await prisma.studySession.update({ where: { id: session.id }, data: { currentProblemId: req.params.problemId } });
    await logActivity(session.id, req.guestId, "PROBLEM_STARTED", { problemId: req.params.problemId });

    emit(req, "session:updated", { action: "problem_started", sessionId: session.id });
    res.json(sessionProblem);
  } catch (err) {
    next(err);
  }
});

const stageSchema = z.object({ stage: z.enum(STAGE_ORDER) });

// PATCH /api/sessions/:id/problems/:problemId/stage — move through Understand → Approach → Implement → Test
router.patch("/sessions/:id/problems/:problemId/stage", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { stage } = stageSchema.parse(req.body);
    const sessionProblem = await prisma.sessionProblem.update({
      where: { sessionId_problemId: { sessionId: session.id, problemId: req.params.problemId } },
      data: { stage },
    });
    emit(req, "session:updated", { action: "problem_stage", sessionId: session.id });
    res.json(sessionProblem);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

const solveSchema = z.object({ confidence: z.number().int().min(1).max(5).optional(), hintsUsed: z.number().int().min(0).optional() });

router.post("/sessions/:id/problems/:problemId/solve", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: { id: req.params.id, guestId: req.guestId },
      include: { problems: true },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const current = session.problems.find((p) => p.problemId === req.params.problemId);
    if (!current) return res.status(404).json({ error: "Problem not in this session" });

    const { confidence, hintsUsed } = solveSchema.parse(req.body);
    const now = new Date();
    // Server computes time spent — never trust a client-supplied duration.
    const additionalTime = current.startedAt ? Math.max(0, Math.round((now - new Date(current.startedAt)) / 1000)) : 0;

    const sessionProblem = await prisma.sessionProblem.update({
      where: { sessionId_problemId: { sessionId: session.id, problemId: req.params.problemId } },
      data: {
        status: "SOLVED",
        stage: "solved",
        completedAt: now,
        timeSpent: { increment: additionalTime },
        confidence: confidence ?? current.confidence,
        hintsUsed: hintsUsed ?? current.hintsUsed,
      },
    });
    
    await prisma.problem.update({
      where: { id: req.params.problemId },
      data: {
        totalAttempts: { increment: 1 },
        totalSolved: { increment: 1 }
      }
    });

    await updateStreakAndActivity(req.guestId, additionalTime, true);
    await logActivity(session.id, req.guestId, "PROBLEM_SOLVED", { problemId: req.params.problemId, timeSpent: additionalTime });

    const remaining = await prisma.sessionProblem.count({ where: { sessionId: session.id, status: { not: "SOLVED" } } });
    if (remaining === 0) {
      await prisma.studySession.update({ where: { id: session.id }, data: { status: "COMPLETED", completedAt: now } });
    }

    emit(req, "session:updated", { action: "problem_solved", sessionId: session.id });
    res.json(sessionProblem);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/sessions/:id/problems/:problemId/fail", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: { id: req.params.id, guestId: req.guestId },
      include: { problems: true },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const current = session.problems.find((p) => p.problemId === req.params.problemId);
    if (!current) return res.status(404).json({ error: "Problem not in this session" });

    const now = new Date();
    const additionalTime = current.startedAt ? Math.max(0, Math.round((now - new Date(current.startedAt)) / 1000)) : 0;

    const sessionProblem = await prisma.sessionProblem.update({
      where: { sessionId_problemId: { sessionId: session.id, problemId: req.params.problemId } },
      data: { status: "FAILED", completedAt: now, timeSpent: { increment: additionalTime }, attempts: { increment: 1 } },
    });
    
    await prisma.problem.update({
      where: { id: req.params.problemId },
      data: {
        totalAttempts: { increment: 1 },
      }
    });

    await updateStreakAndActivity(req.guestId, additionalTime, false);
    await logActivity(session.id, req.guestId, "PROBLEM_FAILED", { problemId: req.params.problemId });

    emit(req, "session:updated", { action: "problem_failed", sessionId: session.id });
    res.json(sessionProblem);
  } catch (err) {
    next(err);
  }
});

router.post("/sessions/:id/problems/:problemId/skip", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const sessionProblem = await prisma.sessionProblem.update({
      where: { sessionId_problemId: { sessionId: session.id, problemId: req.params.problemId } },
      data: { status: "REVISIT" },
    });
    await logActivity(session.id, req.guestId, "PROBLEM_SKIPPED", { problemId: req.params.problemId });

    emit(req, "session:updated", { action: "problem_skipped", sessionId: session.id });
    res.json(sessionProblem);
  } catch (err) {
    next(err);
  }
});

// ── Mistake Review ─────────────────────────────────────────────────

const mistakeCreateSchema = z.object({
  problemId: z.string(),
  mistake: z.string().min(1).max(2000),
  reason: z.string().max(2000).optional(),
  correctConcept: z.string().max(2000).optional(),
  confidence: z.number().int().min(1).max(5).optional(),
});

router.get("/sessions/:id/mistakes", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const mistakes = await prisma.mistakeReview.findMany({
      where: { sessionId: session.id, guestId: req.guestId },
      orderBy: { createdAt: "desc" },
      include: { problem: { select: { title: true, slug: true } } },
    });
    res.json({ mistakes });
  } catch (err) {
    next(err);
  }
});

router.post("/sessions/:id/mistakes", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({ where: { id: req.params.id, guestId: req.guestId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const data = mistakeCreateSchema.parse(req.body);
    const problem = await resolveProblem(data.problemId);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const mistake = await prisma.mistakeReview.create({
      data: { ...data, problemId: problem.id, sessionId: session.id, guestId: req.guestId },
    });
    await logActivity(session.id, req.guestId, "MISTAKE_CREATED", { problemId: problem.id });

    emit(req, "session:updated", { action: "mistake_created", sessionId: session.id });
    res.status(201).json(mistake);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

const mistakeUpdateSchema = z.object({
  mistake: z.string().min(1).max(2000).optional(),
  reason: z.string().max(2000).nullable().optional(),
  correctConcept: z.string().max(2000).nullable().optional(),
  confidence: z.number().int().min(1).max(5).nullable().optional(),
  isReviewed: z.boolean().optional(),
});

router.patch("/sessions/:id/mistakes/:mistakeId", async (req, res, next) => {
  try {
    const existing = await prisma.mistakeReview.findFirst({
      where: { id: req.params.mistakeId, sessionId: req.params.id, guestId: req.guestId },
    });
    if (!existing) return res.status(404).json({ error: "Mistake review not found" });

    const data = mistakeUpdateSchema.parse(req.body);
    const mistake = await prisma.mistakeReview.update({
      where: { id: existing.id },
      data: { ...data, ...(data.isReviewed ? { reviewedAt: new Date() } : {}) },
    });

    emit(req, "session:updated", { action: "mistake_updated", sessionId: req.params.id });
    res.json(mistake);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Analytics (single session) ──────────────────────────────────────

router.get("/sessions/:id/analytics", async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: { id: req.params.id, guestId: req.guestId },
      include: {
        problems: { include: { problem: { select: { title: true, slug: true, difficulty: true, tags: true } } } },
        activity: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const solved = session.problems.filter((p) => p.status === "SOLVED");
    const failed = session.problems.filter((p) => p.status === "FAILED");
    const attempted = solved.length + failed.length;

    const avgSolveTime = solved.length
      ? Math.round(solved.reduce((sum, p) => sum + p.timeSpent, 0) / solved.length)
      : 0;

    const topicCounts = {};
    for (const p of session.problems) {
      const topic = p.problem.tags?.[0] || session.category || "General";
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
    const mostPracticedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    const weakTopics = {};
    for (const p of failed) {
      const topic = p.problem.tags?.[0] || session.category || "General";
      weakTopics[topic] = (weakTopics[topic] || 0) + 1;
    }

    res.json({
      totalFocusSeconds: session.totalFocusedSeconds,
      problemsSolved: solved.length,
      problemsFailed: failed.length,
      successRate: attempted > 0 ? Math.round((solved.length / attempted) * 100) : null,
      avgSolveTimeSeconds: avgSolveTime,
      mostPracticedTopics,
      weakTopics: Object.entries(weakTopics).map(([topic, count]) => ({ topic, count })),
      timeline: session.activity.map((a) => ({ type: a.type, metadata: a.metadata, at: a.createdAt })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
