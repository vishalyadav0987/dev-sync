import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/guestAuth.js";

const router = Router();
router.use(requireAdmin); // every route here requires Authorization: Bearer <ADMIN_TOKEN>

const approachSchema = z.object({
  id: z.string().uuid().optional(), // present => update existing approach, absent => create new
  title: z.string().min(1),
  cppCode: z.string(),
  timeComplexity: z.string().optional().nullable(),
  spaceComplexity: z.string().optional().nullable(),
  approachNotes: z.string().optional().nullable(),
  visualHtml: z.string().optional().nullable(),
  order: z.number().int().default(0),
});

const problemBaseSchema = z.object({
  title: z.string().min(3).max(200),
  statement: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  tags: z.array(z.string()).default([]),
  cppCode: z.string().min(1),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  edgeCases: z.array(z.string()).default([]),
  approachNotes: z.string().optional(),
  visualHtml: z.string().optional(),
  categoryId: z.string().uuid().optional(), // Now optional because we can provide categoryName instead
  categoryName: z.string().optional(),
  approaches: z.array(approachSchema).optional(),
});

const problemSchema = problemBaseSchema.refine(data => data.categoryId || data.categoryName, {
  message: "Either categoryId or categoryName must be provided"
});

// GET /api/admin/problems — list all problems for admin dashboard
router.get("/problems", async (req, res, next) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: { select: { name: true } } }
    });
    res.json(problems);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/problems — daily content entry
router.post("/problems", async (req, res, next) => {
  try {
    const { approaches, ...problemData } = problemSchema.parse(req.body);
    const slug = `${slugify(problemData.title, { lower: true, strict: true })}-${Date.now().toString(36)}`;
    // Strip any client-sent `id` on create — approaches are always brand new here.
    const approachesToCreate = approaches?.map(({ id, ...rest }) => rest);
    const problem = await prisma.problem.create({
      data: {
        ...problemData,
        slug,
        approaches: approachesToCreate?.length ? { create: approachesToCreate } : undefined,
      },
      include: { approaches: { orderBy: { order: "asc" } } },
    });
    res.status(201).json(problem);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// GET /api/admin/problems/:slug — load for editing (including unpublished)
router.get("/problems/:slug", async (req, res, next) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug: req.params.slug },
      include: { 
        category: { select: { name: true, slug: true } },
        approaches: { orderBy: { order: "asc" } }
      },
    });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(problem);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/problems/:id
// Supports updating scalar problem fields AND diffing the `approaches` array in one call:
//   - approach with an existing `id`      -> updated
//   - approach with no `id`               -> created
//   - existing approach not present in payload -> deleted
router.patch("/problems/:id", async (req, res, next) => {
  try {
    const { approaches, categoryName, ...problemData } = problemBaseSchema.partial().parse(req.body);

    const problem = await prisma.$transaction(async (tx) => {
      // 1. Handle category update/creation
      let finalCategoryId = problemData.categoryId;
      if (categoryName) {
        const categorySlug = slugify(categoryName, { lower: true, strict: true });
        let category = await tx.category.findUnique({ where: { slug: categorySlug } });
        if (!category) {
          category = await tx.category.create({
            data: { name: categoryName, slug: categorySlug }
          });
        }
        finalCategoryId = category.id;
        problemData.categoryId = finalCategoryId; // Ensure we update the problem with it
      }

      // Fetch the old category ID before updating
      const oldProblem = await tx.problem.findUnique({
        where: { id: req.params.id },
        select: { categoryId: true }
      });
      
      const oldCategoryId = oldProblem?.categoryId;

      // 2. Handle approaches diffing
      if (approaches) {
        const existing = await tx.problemApproach.findMany({
          where: { problemId: req.params.id },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((a) => a.id));
        const incomingIds = new Set(approaches.filter((a) => a.id).map((a) => a.id));

        const idsToDelete = [...existingIds].filter((id) => !incomingIds.has(id));
        if (idsToDelete.length) {
          await tx.problemApproach.deleteMany({ where: { id: { in: idsToDelete } } });
        }

        await Promise.all(
          approaches.map(({ id, ...rest }, idx) => {
            const payload = { ...rest, order: rest.order ?? idx };
            return id && existingIds.has(id)
              ? tx.problemApproach.update({ where: { id }, data: payload })
              : tx.problemApproach.create({ data: { ...payload, problemId: req.params.id } });
          })
        );
      }

      // 3. Update the problem
      const updatedProblem = await tx.problem.update({
        where: { id: req.params.id },
        data: problemData,
        include: { approaches: { orderBy: { order: "asc" } } },
      });

      // 4. Clean up empty folder if problem was moved
      if (oldCategoryId && finalCategoryId && oldCategoryId !== finalCategoryId) {
        const remaining = await tx.problem.count({ where: { categoryId: oldCategoryId } });
        if (remaining === 0) {
          await tx.category.delete({ where: { id: oldCategoryId } });
        }
      }

      return updatedProblem;
    });

    res.json(problem);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    if (err.code === "P2025") return res.status(404).json({ error: "Problem not found" });
    next(err);
  }
});

// DELETE /api/admin/problems/:id
router.delete("/problems/:id", async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      const problem = await tx.problem.findUnique({
        where: { id: req.params.id },
        select: { categoryId: true }
      });
      if (!problem) throw new Error("Problem not found");
      
      await tx.problem.delete({
        where: { id: req.params.id }
      });
      
      const remaining = await tx.problem.count({ where: { categoryId: problem.categoryId } });
      if (remaining === 0) {
        await tx.category.delete({ where: { id: problem.categoryId } });
      }
    });
    res.json({ success: true });
  } catch (err) {
    if (err.message === "Problem not found" || err.code === "P2025") return res.status(404).json({ error: "Problem not found" });
    next(err);
  }
});

// POST /api/admin/categories — add a folder-tree node
router.post("/categories", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      parentId: z.string().uuid().nullable().optional(),
      order: z.number().int().default(0),
    });
    const data = schema.parse(req.body);
    const slug = slugify(data.name, { lower: true, strict: true });
    const category = await prisma.category.create({ data: { ...data, slug } });
    res.status(201).json(category);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

export default router;
