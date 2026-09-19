import express from "express";
import { PrismaClient } from "@prisma/client";
import { guestIdentity } from "../middleware/guestAuth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Helper: resolve a slug or UUID to a problem record
async function resolveProblem(idOrSlug) {
  // Try UUID first (catch because Prisma throws on invalid UUID format)
  let problem = await prisma.problem.findUnique({ where: { id: idOrSlug } }).catch(() => null);
  if (problem) return problem;
  // Try slug
  problem = await prisma.problem.findUnique({ where: { slug: idOrSlug } }).catch(() => null);
  return problem;
}

// GET /api/notes/:problemId
router.get("/:problemId", guestIdentity, async (req, res) => {
  try {
    const { problemId } = req.params;
    const problem = await resolveProblem(problemId);
    
    if (!problem) {
      return res.json({ notes: [] });
    }
    
    const notes = await prisma.note.findMany({
      where: {
        guestId: req.guestId,
        problemId: problem.id
      },
      orderBy: [
        { stepId: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    res.json({ notes });
  } catch (err) {
    console.error("Failed to fetch notes:", err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// POST /api/notes
router.post("/", guestIdentity, async (req, res) => {
  try {
    const {
      problemId, sessionId, visualizationId, stepId, codeLine, elementId,
      title, content, color, positionX, positionY, width, height, tags, isPinned
    } = req.body;

    // Resolve slug to actual problem UUID
    let resolvedProblemId = null;
    if (problemId) {
      const problem = await resolveProblem(problemId);
      if (problem) {
        resolvedProblemId = problem.id;
      } else {
        return res.status(400).json({ error: "Problem not found for: " + problemId });
      }
    }

    // A note can optionally be attached to a study session — verify the guest
    // actually owns that session before linking to it (never trust the id blindly).
    let resolvedSessionId = null;
    if (sessionId) {
      const session = await prisma.studySession.findFirst({ where: { id: sessionId, guestId: req.guestId } });
      if (!session) return res.status(403).json({ error: "Session not found or not owned by this guest" });
      resolvedSessionId = session.id;
    }

    const note = await prisma.note.create({
      data: {
        guestId: req.guestId,
        problemId: resolvedProblemId,
        sessionId: resolvedSessionId,
        visualizationId,
        stepId,
        codeLine,
        elementId,
        title: title || "",
        content: content || "",
        color: color || "yellow",
        positionX: positionX || 50,
        positionY: positionY || 50,
        width: width || 250,
        height: height || 200,
        tags: tags || [],
        isPinned: isPinned || false
      }
    });
    
    // Broadcast via socket if available
    const io = req.app.get("io");
    if (io) {
      io.to(req.guestId).emit("note:updated", { action: "created", note });
    }
    
    res.status(201).json(note);
  } catch (err) {
    console.error("Failed to create note:", err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// PATCH /api/notes/:id
router.patch("/:id", guestIdentity, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Ensure ownership
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing || existing.guestId !== req.guestId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    const note = await prisma.note.update({
      where: { id },
      data: updates
    });
    
    const io = req.app.get("io");
    if (io) {
      io.to(req.guestId).emit("note:updated", { action: "updated", note });
    }
    
    res.json(note);
  } catch (err) {
    console.error("Failed to update note:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", guestIdentity, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure ownership
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing || existing.guestId !== req.guestId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    await prisma.note.delete({ where: { id } });
    
    const io = req.app.get("io");
    if (io) {
      io.to(req.guestId).emit("note:updated", { action: "deleted", id });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete note:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
