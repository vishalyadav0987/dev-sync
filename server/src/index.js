import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { createServer } from "http";
import { Server } from "socket.io";

import adminRouter from "./routes/admin.js";
import blogsRouter from "./routes/blogs.js";
import problemsRouter from "./routes/problems.js";
import sessionsRouter from "./routes/sessions.js";
import adminRoutes from "./routes/admin.js";
import visualizationsRoutes from "./routes/visualizations.js";
import leetcodeRoutes from "./routes/leetcode.js";
import extensionAuthRoutes from "./routes/extensionAuth.js";
import notesRouter from "./routes/notes.js";
import { startLeetCodeSyncWorker } from "./workers/leetcodeWorker.js";
import { setupChatGateway } from "./services/chat/chat.gateway.js";
import chatRoutes from "./routes/chat.js";
import battleRoutes from "./routes/battle.js";
import { setupBattleGateway } from "./services/battle/battle.gateway.js";
import { startExecutionWorker, setIOInstance } from "./services/execution/execution.worker.js";

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN?.split(",") ?? "*" },
});
app.set("io", io);

// Initialize Chat Socket Events
setupChatGateway(io);
setupBattleGateway(io);

// Provide IO instance to Execution Worker
setIOInstance(io);

io.on("connection", (socket) => {
  console.log("Client connected via socket:", socket.id);
  
  socket.on("join-guest-room", (guestId) => {
    socket.join(guestId);
    console.log(`Socket ${socket.id} joined guest room: ${guestId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.use(helmet({
  crossOriginResourcePolicy: false, // allow loading images from this server
}));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") ?? "*" }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Serve static files from public directory
app.use(express.static("public"));

// Basic write-endpoint throttling — no auth means abuse protection matters more.
app.use(
  "/api/blogs",
  rateLimit({ windowMs: 60_000, limit: 1000, standardHeaders: true, legacyHeaders: false })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", problemsRouter);
app.use("/api", blogsRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/visualizations", visualizationsRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/leetcode/extension", extensionAuthRoutes);
app.use("/api/notes", notesRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/battles", battleRoutes);
app.use("/api", sessionsRouter);

// 404
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;

// Start background workers
startLeetCodeSyncWorker();
startExecutionWorker();

httpServer.listen(PORT, () => console.log(`API and Socket.io listening on :${PORT}`));

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down server...");
  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGUSR2", shutdown); // For nodemon restarts

