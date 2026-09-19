import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { guestIdentity } from "../middleware/guestAuth.js";

const router = Router();

const blogSchema = z.object({
  title: z.string().min(3).max(200),
  contentMd: z.string().min(1).max(50_000),
});

// Non-blocking middleware to extract guestId for public routes
const optionalGuest = (req, res, next) => {
  req.guestId = req.header("x-guest-id");
  next();
};

// GET /api/blogs — list (paginated)
router.get("/blogs", optionalGuest, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = 10;
    const authorId = req.query.authorId; // Optional filter for dashboard

    const where = { published: true };
    if (authorId) where.authorId = authorId;
    if (req.query.drafts === "true" && authorId === req.guestId) {
      delete where.published; // Allow author to see their own drafts
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          contentMd: true,
          createdAt: true,
          published: true,
          author: { select: { id: true, displayName: true } },
          _count: { select: { comments: true, likes: true } },
          ...(req.guestId ? { likes: { where: { guestId: req.guestId }, select: { id: true } } } : {}),
        },
      }),
      prisma.blog.count({ where }),
    ]);

    // Format the response to include hasLiked
    const formattedBlogs = blogs.map(blog => ({
      ...blog,
      hasLiked: blog.likes ? blog.likes.length > 0 : false,
      likes: undefined, // remove the array
    }));

    res.json({ blogs: formattedBlogs, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// GET /api/blogs/saved/list — list user's saved blogs
router.get("/blogs/saved/list", guestIdentity, async (req, res, next) => {
  try {
    const saved = await prisma.savedBlog.findMany({
      where: { guestId: req.guestId },
      include: {
        blog: {
          include: {
            author: { select: { id: true, displayName: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Flatten
    const blogs = saved.map(s => s.blog);
    res.json({ blogs });
  } catch (err) {
    next(err);
  }
});

// GET /api/blogs/:slug — single post + comments
router.get("/blogs/:slug", optionalGuest, async (req, res, next) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { slug: req.params.slug },
      include: {
        author: { select: { id: true, displayName: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, displayName: true } } },
        },
        _count: { select: { likes: true } },
        ...(req.guestId ? { 
          likes: { where: { guestId: req.guestId }, select: { id: true } },
          savedBy: { where: { guestId: req.guestId }, select: { id: true } }
        } : {}),
      },
    });
    
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Format
    const hasLiked = blog.likes ? blog.likes.length > 0 : false;
    const hasSaved = blog.savedBy ? blog.savedBy.length > 0 : false;
    delete blog.likes;
    delete blog.savedBy;
    
    res.json({ ...blog, hasLiked, hasSaved });
  } catch (err) {
    next(err);
  }
});

// POST /api/blogs — create (requires x-guest-id)
router.post("/blogs", guestIdentity, async (req, res, next) => {
  try {
    const parsed = blogSchema.parse(req.body);
    const baseSlug = slugify(parsed.title, { lower: true, strict: true });
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    
    // Support saving as draft
    const published = req.body.published !== false;

    const blog = await prisma.blog.create({
      data: { ...parsed, slug, authorId: req.guestId, published },
    });
    res.status(201).json(blog);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// PATCH /api/blogs/:id — edit, only if requester owns it (authorId === guestId)
router.patch("/blogs/:id", guestIdentity, async (req, res, next) => {
  try {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Blog not found" });
    if (existing.authorId !== req.guestId) {
      return res.status(403).json({ error: "You do not own this post" });
    }

    const parsed = blogSchema.partial().parse(req.body);
    const data = { ...parsed };
    if (req.body.published !== undefined) data.published = req.body.published;

    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data,
    });
    res.json(blog);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// DELETE /api/blogs/:id — owner only
router.delete("/blogs/:id", guestIdentity, async (req, res, next) => {
  try {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Blog not found" });
    if (existing.authorId !== req.guestId) {
      return res.status(403).json({ error: "You do not own this post" });
    }
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/blogs/:id/comments
router.post("/blogs/:id/comments", guestIdentity, async (req, res, next) => {
  try {
    const body = z.string().min(1).max(2000).parse(req.body.body);
    const comment = await prisma.comment.create({
      data: { body, blogId: req.params.id, authorId: req.guestId },
      include: { author: { select: { id: true, displayName: true } } },
    });

    // Broadcast to connected clients
    const io = req.app.get("io");
    if (io) io.emit("blog:new_comment", comment);

    res.status(201).json(comment);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// POST /api/blogs/:id/like
router.post("/blogs/:id/like", guestIdentity, async (req, res, next) => {
  try {
    const blogId = req.params.id;
    const guestId = req.guestId;

    await prisma.blogLike.upsert({
      where: { blogId_guestId: { blogId, guestId } },
      update: {},
      create: { blogId, guestId },
    });

    const likesCount = await prisma.blogLike.count({ where: { blogId } });

    const io = req.app.get("io");
    if (io) io.emit("blog:like_update", { blogId, likesCount });

    res.json({ success: true, likesCount, hasLiked: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/blogs/:id/like
router.delete("/blogs/:id/like", guestIdentity, async (req, res, next) => {
  try {
    const blogId = req.params.id;
    const guestId = req.guestId;

    await prisma.blogLike.deleteMany({
      where: { blogId, guestId },
    });

    const likesCount = await prisma.blogLike.count({ where: { blogId } });

    const io = req.app.get("io");
    if (io) io.emit("blog:like_update", { blogId, likesCount });

    res.json({ success: true, likesCount, hasLiked: false });
  } catch (err) {
    next(err);
  }
});


// POST /api/blogs/:id/save
router.post("/blogs/:id/save", guestIdentity, async (req, res, next) => {
  try {
    const blogId = req.params.id;
    const guestId = req.guestId;

    await prisma.savedBlog.upsert({
      where: { blogId_guestId: { blogId, guestId } },
      update: {},
      create: { blogId, guestId },
    });

    res.json({ success: true, hasSaved: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/blogs/:id/save
router.delete("/blogs/:id/save", guestIdentity, async (req, res, next) => {
  try {
    const blogId = req.params.id;
    const guestId = req.guestId;

    await prisma.savedBlog.deleteMany({
      where: { blogId, guestId },
    });

    res.json({ success: true, hasSaved: false });
  } catch (err) {
    next(err);
  }
});

export default router;
