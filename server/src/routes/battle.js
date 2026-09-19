import express from "express";
import { BattleService } from "../services/battle/battle.service.js";
import { ExecutionService } from "../services/execution/execution.service.js";
import { BattleRoomStore } from "../services/battle/battle.room.js";
import { addMessage } from "../services/chat/chat.service.js";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const prisma = new PrismaClient();

const router = express.Router();

const createBattleLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many battles created. You are restricted to 3 rooms per day for now." }
});

router.post("/", createBattleLimiter, async (req, res) => {
  try {
    const { uuid, problemIds, maxPlayers, durationMinutes } = req.body;
    
    if (!uuid || !problemIds || !Array.isArray(problemIds) || problemIds.length === 0 || !maxPlayers) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const parsedMaxPlayers = parseInt(maxPlayers, 10);
    if (isNaN(parsedMaxPlayers) || parsedMaxPlayers < 2 || parsedMaxPlayers > 10) {
      return res.status(400).json({ error: "Invalid max players (must be between 2 and 10)" });
    }
    
    const parsedDuration = durationMinutes ? parseInt(durationMinutes, 10) : 30;
    
    const battle = await BattleService.createBattle({ 
      uuid, 
      problemIds, 
      maxPlayers: parsedMaxPlayers,
      durationMinutes: parsedDuration
    });
    
    const io = req.app.get("io");
    if (io) {
      io.of("/battle").emit("battle:waiting-updated");
      
      // Feature 2: Automatic Global Chat Battle Announcement
      try {
        const messageId = `msg_${crypto.randomUUID()}`;
        const messageObj = {
          id: messageId,
          roomId: "global",
          participantId: "system",
          displayName: "System",
          avatar: "⚔️",
          type: "battle_invite",
          content: {
            battleId: battle.roomId,
            displayName: battle.host,
            problemTitle: battle.problems[0]?.title || "Mystery Problem",
            difficulty: battle.problems[0]?.difficulty || "UNKNOWN",
            currentPlayers: 1,
            maxPlayers: battle.maxPlayers,
            status: "WAITING"
          },
          createdAt: new Date().toISOString()
        };
        
        await addMessage("global", messageObj);
        io.of("/chat").to("chat:global").emit("chat:message", messageObj);
      } catch (chatErr) {
        console.error("Failed to broadcast battle invite to global chat:", chatErr);
      }
    }
    
    res.json(battle);
  } catch (err) {
    console.error("Create battle error:", err);
    if (err.message === "ALREADY_IN_BATTLE") {
      return res.status(400).json({ error: "You are already in an active battle" });
    }
    res.status(500).json({ error: err.message || "Failed to create battle" });
  }
});

router.get("/problems", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || "";
    const difficulty = req.query.difficulty || "";

    const data = await BattleService.getProblems({ page, limit, search, difficulty });
    res.json(data);
  } catch (err) {
    console.error("Get battle problems error:", err);
    res.status(500).json({ success: false, error: "Failed to load problems" });
  }
});

router.get("/waiting", async (req, res) => {
  try {
    const data = await BattleService.getWaitingRooms();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Get waiting battles error:", err);
    res.status(500).json({ success: false, error: "Failed to load waiting battles" });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const stats = await BattleService.getGlobalLeaderboard();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/:guestId", async (req, res) => {
  try {
    const data = await BattleService.getUserBattleStats(req.params.guestId);
    if (!data) return res.status(404).json({ error: "User not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const battleData = await BattleService.getBattle(roomId);
    res.json(battleData);
  } catch (err) {
    if (err.message === "Battle not found") {
      res.status(404).json({ error: "Battle not found" });
    } else {
      console.error("Get battle error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ═══════════════════════════════════════════════════════════════
// RUN — Execute code against PUBLIC test cases only
// ═══════════════════════════════════════════════════════════════
router.post("/run", async (req, res) => {
  try {
    const { roomId, uuid, code, language, problemId } = req.body;
    if (!roomId || !uuid || !code || !language || !problemId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const room = await BattleRoomStore.getRoom(roomId);
    if (!room || room.status !== "ACTIVE") {
      return res.status(400).json({ error: "Battle is not active" });
    }

    // Update player status to RUNNING
    const players = await BattleRoomStore.getPlayers(roomId);
    const participant = players.find(p => p.uuid === uuid);

    if (participant) {
      await BattleRoomStore.updatePlayer(roomId, participant.participantId, { status: "RUNNING" });
      const io = req.app.get("io");
      if (io) {
        const updatedPlayers = await BattleRoomStore.getPlayers(roomId);
        io.of("/battle").to(`battle:${roomId}`).emit("battle:player-updated", { players: updatedPlayers });
      }
    }

    // Queue execution job — only public test cases
    const { jobId, testCount } = await ExecutionService.submitRun({
      roomId,
      uuid,
      participantId: participant?.participantId,
      problemId,
      code,
      language
    });

    // Respond immediately with jobId — results stream via Socket.IO
    res.json({
      success: true,
      jobId,
      testCount,
      message: "Code submitted for execution. Results will stream via Socket.IO."
    });
  } catch (err) {
    console.error("Run error:", err);
    res.status(500).json({ error: err.message || "Failed to execute code" });
  }
});

// ═══════════════════════════════════════════════════════════════
// SUBMIT — Execute code against ALL test cases (public + hidden)
// ═══════════════════════════════════════════════════════════════
router.post("/submit", async (req, res) => {
  try {
    const { roomId, uuid, code, language, problemId } = req.body;
    if (!roomId || !uuid || !code || !language || !problemId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const room = await BattleRoomStore.getRoom(roomId);
    if (!room || room.status !== "ACTIVE") {
      return res.status(400).json({ error: "Battle is not active" });
    }

    const players = await BattleRoomStore.getPlayers(roomId);
    const participant = players.find(p => p.uuid === uuid);

    if (participant) {
      await BattleRoomStore.updatePlayer(roomId, participant.participantId, { status: "SUBMITTED" });
      const io = req.app.get("io");
      if (io) {
        const updatedPlayers = await BattleRoomStore.getPlayers(roomId);
        io.of("/battle").to(`battle:${roomId}`).emit("battle:player-updated", { players: updatedPlayers });
      }
    }

    // Queue execution job — ALL test cases
    const { jobId, testCount } = await ExecutionService.submitSubmission({
      roomId,
      uuid,
      participantId: participant?.participantId,
      problemId,
      code,
      language
    });

    // Respond immediately with jobId — results stream via Socket.IO
    res.json({
      success: true,
      jobId,
      testCount,
      message: "Submission queued. Results will stream via Socket.IO."
    });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: err.message || "Failed to submit code" });
  }
});

export default router;
