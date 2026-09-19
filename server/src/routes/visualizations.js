import express from "express";
import { PrismaClient } from "@prisma/client";
import { guestIdentity } from "../middleware/guestAuth.js";

const router = express.Router();
const prisma = new PrismaClient();

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: resolve a slug or UUID to a problem record
async function resolveProblem(idOrSlug) {
  let problem = await prisma.problem.findUnique({ where: { id: idOrSlug } }).catch(() => null);
  if (problem) return problem;
  problem = await prisma.problem.findUnique({ where: { slug: idOrSlug } });
  return problem;
}

// GET /api/visualizations/:problemId
router.get("/:problemId", guestIdentity, async (req, res) => {
  try {
    const { problemId } = req.params;
    
    // Attempt to load from DB first (supports both slug and UUID)
    const problem = await resolveProblem(problemId);
    
    let htmlContent = problem?.visualHtml;
    
    if (!htmlContent) {
      // Fallback to the nqueens.html file for demonstration
      try {
        const filePath = path.join(__dirname, "../../nqueens.html");
        htmlContent = fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error("Could not read nqueens.html:", err);
        return res.status(404).json({ error: "Visualization not found" });
      }
    }
    
    // Inject the postMessage bridge into the HTML before serving it.
    // This allows the standalone nqueens.html to communicate with our React parent player.
    const bridgeScript = `
    <script>
      (function() {
        // Wait for the visualizer to be fully loaded
        window.addEventListener('load', () => {
          // Listen for commands from the parent
          window.addEventListener('message', (e) => {
            if (!e.data) return;
            
            if (e.data.type === 'PLAY') {
              if (typeof toggleAutoPlay === 'function' && !window.autoPlayInterval) {
                toggleAutoPlay();
              }
            } else if (e.data.type === 'PAUSE') {
              if (typeof stopAutoPlay === 'function') {
                stopAutoPlay();
              }
            } else if (e.data.type === 'SEEK') {
              if (typeof window.seekTo === 'function') {
                window.seekTo(e.data.step);
              }
            } else if (e.data.type === 'REQUEST_STATE') {
              if (window.simHistory) {
                window.parent.postMessage({ 
                  type: 'VISUALIZATION_READY', 
                  totalSteps: window.simHistory.length,
                  capabilities: { stepNavigation: true, autoPlay: true, codeSync: true, notes: true, variableInspector: true }
                }, '*');
              }
              sendState();
            }
          });

          // Override updateUI to intercept step changes and send to parent
          if (typeof window.updateUI === 'function') {
            const originalUpdateUI = window.updateUI;
            window.updateUI = function(index) {
              originalUpdateUI(index);
              sendState();
            };
          }
          
          function sendState() {
             if (window.simHistory && window.simHistory[window.getCurrentIndex()]) {
                const state = window.simHistory[window.getCurrentIndex()];
                window.parent.postMessage({
                  type: 'STEP_CHANGED',
                  step: window.getCurrentIndex(),
                  totalSteps: window.simHistory.length,
                  codeLine: state.line,
                  vars: state.vars
                }, '*');
             }
          }
          
          // Tell parent we are ready
          if (window.simHistory) {
            window.parent.postMessage({ 
              type: 'VISUALIZATION_READY', 
              totalSteps: window.simHistory.length,
              capabilities: { stepNavigation: true, autoPlay: true, codeSync: true, notes: true, variableInspector: true }
            }, '*');
          }
        });
      })();
    </script>
    `;
    
    // Insert bridge script right before </body>
    const modifiedHtml = htmlContent.replace('</body>', bridgeScript + '</body>');

    res.json({
      id: `vis-${problemId}`,
      problemId: problemId,
      version: 1,
      html: modifiedHtml,
      metadata: {
        totalSteps: 320, // Will be overridden by VISUALIZATION_READY
        capabilities: {
          stepNavigation: true,
          autoPlay: true,
          codeSync: true,
          variableInspector: true,
          callStack: false,
          notes: true
        }
      }
    });
  } catch (err) {
    console.error("Failed to fetch visualization:", err);
    res.status(500).json({ error: "Failed to fetch visualization" });
  }
});

// GET /api/visualizations/:problemId/history
router.get("/:problemId/history", guestIdentity, async (req, res) => {
  try {
    const { problemId } = req.params;
    const history = await prisma.visualizationHistory.findUnique({
      where: {
        guestId_problemId: {
          guestId: req.guestId,
          problemId
        }
      }
    });
    
    res.json(history || { lastStep: 0, totalSessions: 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// POST /api/visualizations/:problemId/history
router.post("/:problemId/history", guestIdentity, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { lastStep, totalSteps } = req.body;
    
    const percentage = totalSteps > 0 ? (lastStep / (totalSteps - 1)) * 100 : 0;

    const history = await prisma.visualizationHistory.upsert({
      where: {
        guestId_problemId: {
          guestId: req.guestId,
          problemId
        }
      },
      update: {
        lastStep,
        completionPercentage: percentage,
        updatedAt: new Date()
      },
      create: {
        guestId: req.guestId,
        problemId,
        lastStep,
        totalSessions: 1,
        completionPercentage: percentage
      }
    });
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to update history" });
  }
});

// GET /api/visualizations/:problemId/bookmarks
router.get("/:problemId/bookmarks", guestIdentity, async (req, res) => {
  try {
    const { problemId } = req.params;
    const bookmarks = await prisma.stepBookmark.findMany({
      where: { guestId: req.guestId, problemId },
      orderBy: { stepId: 'asc' }
    });
    res.json({ bookmarks });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// POST /api/visualizations/:problemId/bookmarks
router.post("/:problemId/bookmarks", guestIdentity, async (req, res) => {
  try {
    const { problemId } = req.params;
    const { stepId, note } = req.body;
    
    const bookmark = await prisma.stepBookmark.upsert({
      where: {
        guestId_problemId_stepId: {
          guestId: req.guestId,
          problemId,
          stepId
        }
      },
      update: { note },
      create: {
        guestId: req.guestId,
        problemId,
        stepId,
        note
      }
    });
    res.json(bookmark);
  } catch (err) {
    res.status(500).json({ error: "Failed to add bookmark" });
  }
});

// DELETE /api/visualizations/:problemId/bookmarks/:stepId
router.delete("/:problemId/bookmarks/:stepId", guestIdentity, async (req, res) => {
  try {
    const { problemId, stepId } = req.params;
    
    await prisma.stepBookmark.delete({
      where: {
        guestId_problemId_stepId: {
          guestId: req.guestId,
          problemId,
          stepId: parseInt(stepId, 10)
        }
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete bookmark" });
  }
});

export default router;
