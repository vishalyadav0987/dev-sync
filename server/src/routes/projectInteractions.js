import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { guestIdentity } from "../middleware/guestAuth.js";
import { z } from "zod";

const router = Router();

// Middleware to get guestId without failing if not provided (for views/fetching)
const optionalGuest = (req, res, next) => {
  req.guestId = req.header("x-guest-id");
  next();
};

// GET /api/projects/:id/interactions
// Returns whether the current user has liked/saved the project, and counts.
router.get("/projects/:id/interactions", optionalGuest, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { guestId } = req;

    const [likesCount, commentsCount, savesCount] = await Promise.all([
      prisma.projectLike.count({ where: { projectId: id } }),
      prisma.projectComment.count({ where: { projectId: id } }),
      prisma.savedProject.count({ where: { projectId: id } }),
    ]);

    let isLiked = false;
    let isSaved = false;

    if (guestId) {
      const [like, save] = await Promise.all([
        prisma.projectLike.findUnique({
          where: { projectId_guestId: { projectId: id, guestId } },
        }),
        prisma.savedProject.findUnique({
          where: { projectId_guestId: { projectId: id, guestId } },
        }),
      ]);
      isLiked = !!like;
      isSaved = !!save;
    }

    res.json({
      isLiked,
      isSaved,
      likesCount,
      commentsCount,
      savesCount
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/like - Toggle like
router.post("/projects/:id/like", guestIdentity, async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const guestId = req.guestId;

    const existing = await prisma.projectLike.findUnique({
      where: { projectId_guestId: { projectId, guestId } },
    });

    let isLiked = false;
    if (existing) {
      await prisma.projectLike.delete({ where: { id: existing.id } });
      isLiked = false;
    } else {
      await prisma.projectLike.create({
        data: { projectId, guestId },
      });
      isLiked = true;

      // Create notification
      const project = await prisma.publishedProject.findUnique({ where: { id: projectId } });
      const guest = await prisma.guestSession.findUnique({ where: { id: guestId } });
      if (project && project.ownerId !== guestId) {
        await prisma.notification.create({
          data: {
            guestId: project.ownerId,
            type: "LIKE_PROJECT",
            title: "Project Liked!",
            message: `${guest?.displayName || 'Someone'} liked your project ${project.name}.`,
            link: `/projects/${project.slug}`,
          }
        });
        const io = req.app.get("io");
        if (io) io.to(project.ownerId).emit("notification:new", { message: "Someone liked your project!" });
      }
    }
    
    const likesCount = await prisma.projectLike.count({ where: { projectId } });
    const io = req.app.get("io");
    if (io) io.emit("project:statsUpdated", { projectId, updates: { _count: { likes: likesCount } } });

    return res.json({ isLiked });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/save - Toggle save/bookmark
router.post("/projects/:id/save", guestIdentity, async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const guestId = req.guestId;

    const existing = await prisma.savedProject.findUnique({
      where: { projectId_guestId: { projectId, guestId } },
    });

    let isSaved = false;
    if (existing) {
      await prisma.savedProject.delete({ where: { id: existing.id } });
      isSaved = false;
    } else {
      await prisma.savedProject.create({
        data: { projectId, guestId },
      });
      isSaved = true;
    }
    
    const savesCount = await prisma.savedProject.count({ where: { projectId } });
    const io = req.app.get("io");
    if (io) io.emit("project:statsUpdated", { projectId, updates: { saves: savesCount } });

    return res.json({ isSaved });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/view - Increment view count
router.post("/projects/:id/view", optionalGuest, async (req, res, next) => {
  try {
    const { id } = req.params;
    // In a real app we'd debounce this per IP/Session using Redis.
    // For now, we'll just increment it directly.
    const project = await prisma.publishedProject.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
    const io = req.app.get("io");
    if (io) io.emit("project:statsUpdated", { projectId: id, updates: { views: project.views } });
    res.json({ views: project.views });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/click/github - Increment GitHub clicks
router.post("/projects/:id/click/github", async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.publishedProject.update({
      where: { id },
      data: { githubClicks: { increment: 1 } },
    });
    const io = req.app.get("io");
    if (io) io.emit("project:statsUpdated", { projectId: id, updates: { githubClicks: project.githubClicks } });
    res.json({ githubClicks: project.githubClicks });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/click/live - Increment Live Demo clicks
router.post("/projects/:id/click/live", async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.publishedProject.update({
      where: { id },
      data: { liveClicks: { increment: 1 } },
    });
    const io = req.app.get("io");
    if (io) io.emit("project:statsUpdated", { projectId: id, updates: { liveClicks: project.liveClicks } });
    res.json({ liveClicks: project.liveClicks });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/comments - Fetch comments
router.get("/projects/:id/comments", async (req, res, next) => {
  try {
    const { id } = req.params;
    const comments = await prisma.projectComment.findMany({
      where: { projectId: id },
      include: {
        author: { select: { id: true, displayName: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

const commentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(2000),
});

// POST /api/projects/:id/comments - Add comment
router.post("/projects/:id/comments", guestIdentity, async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { body } = commentSchema.parse(req.body);

    const comment = await prisma.projectComment.create({
      data: {
        projectId,
        authorId: req.guestId,
        body
      },
      include: {
        author: { select: { id: true, displayName: true } }
      }
    });

    const commentsCount = await prisma.projectComment.count({ where: { projectId } });
    const io = req.app.get("io");
    if (io) {
      io.emit("project:newComment", { projectId, comment });
      io.emit("project:statsUpdated", { projectId, updates: { _count: { comments: commentsCount } } });
    }

    // Create notification
    const project = await prisma.publishedProject.findUnique({ where: { id: projectId } });
    const guest = await prisma.guestSession.findUnique({ where: { id: req.guestId } });
    if (project && project.ownerId !== req.guestId) {
      await prisma.notification.create({
        data: {
          guestId: project.ownerId,
          type: "COMMENT_PROJECT",
          title: "New Comment on Project",
          message: `${guest?.displayName || 'Someone'} commented on your project ${project.name}.`,
          link: `/projects/${project.slug}`,
        }
      });
      if (io) io.to(project.ownerId).emit("notification:new", { message: "New comment on your project!" });
    }

    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    next(error);
  }
});

export default router;
