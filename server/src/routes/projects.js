import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { guestIdentity } from "../middleware/guestAuth.js";

const router = Router();

const projectSchema = z.object({
  name: z.string().max(100).optional().default(""),
  description: z.string().max(100000).default(""),
  githubUrl: z.string().url().optional().or(z.literal("")),
  liveUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(["PUBLIC", "UNLISTED", "DRAFT"]).default("PUBLIC"),
}).superRefine((data, ctx) => {
  if (data.visibility !== "DRAFT") {
    if (data.name.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Project name must be at least 3 characters for published projects.",
        path: ["name"],
      });
    }
    if (data.description.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Description must be at least 10 characters for published projects.",
        path: ["description"],
      });
    }
  }
});

const optionalGuest = (req, res, next) => {
  req.guestId = req.header("x-guest-id");
  next();
};

// GET /api/projects - list (paginated)
router.get("/projects", optionalGuest, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = 12;
    const ownerId = req.query.ownerId; // Optional filter for dashboard

    const where = {};
    
    if (ownerId) {
        where.ownerId = ownerId;
        // If the requester is the owner, they can see all visibilities.
        // If not the owner, they can only see PUBLIC.
        if (ownerId !== req.guestId) {
            where.visibility = "PUBLIC";
        }
    } else {
        // Exclude DRAFT from explore
        where.visibility = "PUBLIC";
    }

    const [projects, total] = await Promise.all([
      prisma.publishedProject.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          githubUrl: true,
          liveUrl: true,
          coverImage: true,
          tags: true,
          visibility: true,
          publishedAt: true,
          createdAt: true,
          owner: { select: { id: true, displayName: true } },
        },
      }),
      prisma.publishedProject.count({ where }),
    ]);

    res.json({
      projects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:slug - project details
router.get("/projects/:slug", optionalGuest, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const project = await prisma.publishedProject.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, displayName: true } },
      },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.visibility === "DRAFT" && project.ownerId !== req.guestId) {
      return res.status(403).json({ error: "Forbidden: You cannot view this draft." });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - create new project
router.post("/projects", guestIdentity, async (req, res, next) => {
  try {
    const data = projectSchema.parse(req.body);
    let slug = slugify(data.name || "untitled", { lower: true, strict: true });
    if (!slug) slug = "draft";
    
    // Check for slug collision
    const existing = await prisma.publishedProject.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    const project = await prisma.publishedProject.create({
      data: {
        ...data,
        slug,
        ownerId: req.guestId,
        publishedAt: data.visibility !== "DRAFT" ? new Date() : null,
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    next(error);
  }
});

// PATCH /api/projects/:id - edit project
router.patch("/projects/:id", guestIdentity, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = projectSchema.partial().parse(req.body);
    
    const project = await prisma.publishedProject.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.ownerId !== req.guestId) return res.status(403).json({ error: "Forbidden" });

    let slug = project.slug;
    if (data.name !== undefined && data.name !== project.name) {
        slug = slugify(data.name || "untitled", { lower: true, strict: true });
        if (!slug) slug = "draft";
        const existing = await prisma.publishedProject.findUnique({ where: { slug } });
        if (existing && existing.id !== id) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
        }
        data.slug = slug;
    }

    if (data.visibility && data.visibility !== "DRAFT" && !project.publishedAt) {
      data.publishedAt = new Date();
    }

    const updated = await prisma.publishedProject.update({
      where: { id },
      data,
    });

    res.json({ project: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    next(error);
  }
});

// DELETE /api/projects/:id - unpublish/delete
router.delete("/projects/:id", guestIdentity, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.publishedProject.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.ownerId !== req.guestId) return res.status(403).json({ error: "Forbidden" });

    await prisma.publishedProject.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
