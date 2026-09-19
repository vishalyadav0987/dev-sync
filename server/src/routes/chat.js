import { Router } from "express";
import { MediaStorageService, GifService } from "../services/chat/chat.media.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = Router();

// Upload image (base64)
router.post("/media/upload", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }
    
    const url = await MediaStorageService.uploadImage(image);
    res.json({ url });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Search GIFs
router.get("/media/gifs", async (req, res) => {
  try {
    const { q } = req.query;
    const gifs = await GifService.searchGifs(q);
    res.json(gifs);
  } catch (err) {
    console.error("GIF search error:", err);
    res.status(500).json({ error: "Failed to fetch GIFs" });
  }
});

// Report a message
router.post("/messages/:id/report", async (req, res) => {
  try {
    const messageId = req.params.id;
    const { reporterId, reason } = req.body;
    
    if (!reporterId) {
      return res.status(400).json({ error: "Missing reporterId" });
    }

    const report = await prisma.chatReport.create({
      data: {
        messageId,
        reporterId,
        reason: reason || "Inappropriate content"
      }
    });

    res.json({ success: true, reportId: report.id });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
