import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { guestIdentity } from "../middleware/guestAuth.js";

const router = Router();

// GET /api/notifications - List user notifications
router.get("/notifications", guestIdentity, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { guestId: req.guestId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read - Mark specific notification as read
router.put("/notifications/:id/read", guestIdentity, async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.updateMany({
      where: { id, guestId: req.guestId },
      data: { isRead: true },
    });
    res.json({ success: true, updated: notification.count });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put("/notifications/read-all", guestIdentity, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.updateMany({
      where: { guestId: req.guestId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, updated: notifications.count });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count
router.get("/notifications/unread-count", guestIdentity, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { guestId: req.guestId, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

export default router;
