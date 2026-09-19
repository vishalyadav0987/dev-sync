import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { guestIdentity } from "../middleware/guestAuth.js";
import { analyzeProblemWithGemini } from "../services/gemini.js";

const router = Router();

// GET /api/categories — full folder tree (flat list, client nests it by parentId)
router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { order: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        order: true,
        _count: { select: { problems: true } },
      },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// GET /api/problems?category=slug&difficulty=EASY&search=two+sum
router.get("/problems", async (req, res, next) => {
  try {
    const { category, difficulty, search } = req.query;

    const where = {
      isPublished: true,
      ...(difficulty ? { difficulty } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { tags: { has: search.toLowerCase() } },
            ],
          }
        : {}),
    };

    const problems = await prisma.problem.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
        categoryId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(problems);
  } catch (err) {
    next(err);
  }
});

// GET /api/problems/:slug — full detail incl. code + analyzer payload
router.get("/problems/:slug", async (req, res, next) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug },
      include: { 
        category: { select: { name: true, slug: true } },
        approaches: { orderBy: { order: "asc" } }
      },
    });
    if (!problem || !problem.isPublished) {
      return res.status(404).json({ error: "Problem not found" });
    }
    res.json(problem);
  } catch (err) {
    next(err);
  }
});

// POST /api/problems/:slug/track-copy
router.post("/problems/:slug/track-copy", async (req, res, next) => {
  try {
    const problem = await prisma.problem.update({
      where: { slug: req.params.slug },
      data: { copyCount: { increment: 1 } },
    });
    
    const io = req.app.get("io");
    if (io) {
      io.emit("problem-stats-updated", { 
        slug: problem.slug, 
        copyCount: problem.copyCount, 
        vizViewCount: problem.vizViewCount 
      });
    }
    
    res.json({ copyCount: problem.copyCount });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Problem not found" });
    next(err);
  }
});

// POST /api/problems/:slug/track-viz
router.post("/problems/:slug/track-viz", async (req, res, next) => {
  try {
    const problem = await prisma.problem.update({
      where: { slug: req.params.slug },
      data: { vizViewCount: { increment: 1 } },
    });
    
    const io = req.app.get("io");
    if (io) {
      io.emit("problem-stats-updated", { 
        slug: problem.slug, 
        copyCount: problem.copyCount, 
        vizViewCount: problem.vizViewCount 
      });
    }

    res.json({ vizViewCount: problem.vizViewCount });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Problem not found" });
    next(err);
  }
});

// GET /api/problems/:slug/note
router.get("/problems/:slug/note", guestIdentity, async (req, res, next) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug },
      select: { id: true },
    });
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const note = await prisma.note.findFirst({
      where: { guestId: req.guestId, problemId: problem.id },
    });
    res.json({ content: note ? note.content : "" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/problems/:slug/note
router.put("/problems/:slug/note", guestIdentity, async (req, res, next) => {
  try {
    const { content } = req.body;
    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug },
      select: { id: true },
    });
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    // Since guestId + problemId doesn't have a strict @@unique in the schema, we use findFirst + create/update
    let note = await prisma.note.findFirst({
      where: { guestId: req.guestId, problemId: problem.id },
    });

    if (note) {
      note = await prisma.note.update({
        where: { id: note.id },
        data: { content },
      });
    } else {
      note = await prisma.note.create({
        data: {
          content,
          guestId: req.guestId,
          problemId: problem.id,
        },
      });
    }
    res.json({ content: note.content });
  } catch (err) {
    next(err);
  }
});

// POST /api/problems/:slug/analyze
router.post("/problems/:slug/analyze", async (req, res, next) => {
  try {
    const { customInput } = req.body;
    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug }
    });
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    // Use existing code. Wait, we should just use cppCode since we don't know other languages for now, or just use `cppCode`.
    const analysis = await analyzeProblemWithGemini({
      title: problem.title,
      code: problem.cppCode,
      customInput
    });

    // We don't save it if customInput is present, because it's ad-hoc.
    // If no custom input, it's a global analysis.
    if (!customInput) {
      await prisma.problem.update({
        where: { id: problem.id },
        data: {
          edgeCases: analysis.edgeCases || [],
          approachNotes: analysis.approachNotes || "",
          timeComplexity: analysis.timeComplexity || "",
          spaceComplexity: analysis.spaceComplexity || "",
          tags: analysis.tags || [],
          statement: analysis.statement || problem.statement,
          visualHtml: analysis.visualHtml || null
        }
      });
    }

    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

export default router;
