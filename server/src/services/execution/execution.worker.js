/**
 * Execution Worker — Processes code execution jobs from the BullMQ queue.
 * 
 * Flow:
 *   1. Receive job from queue
 *   2. Generate C++ harness from user code + problem metadata
 *   3. Compile
 *   4. Run against each test case sequentially
 *   5. Emit real-time results via Socket.IO after each test case
 *   6. Return final verdict
 */

import { Worker } from "bullmq";
import { Judge0Runner } from "./judge0.runner.js";
import { CppRunner } from "./cpp.runner.js"; // Kept for generating stdin/harness if needed
import { LocalRunner } from "./local.runner.js";
import { JudgeService } from "./judge.service.js";
import battlePrisma from "../../lib/battlePrisma.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function parseRedisUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port, 10) || 6379,
      password: parsed.password || undefined,
    };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}

let ioInstance = null;

export function setIOInstance(io) {
  ioInstance = io;
}

function emitExecutionEvent(roomId, uuid, event, data) {
  if (!ioInstance) return;
  ioInstance.of("/battle").to(`battle:${roomId}`).emit(event, {
    ...data,
    uuid,
    timestamp: Date.now()
  });
}

async function processJob(job) {
  const {
    jobId,
    roomId,
    uuid,
    participantId,
    problemId,
    code,
    language,
    mode,
    testCases
  } = job.data;

  // Fetch the latest problem data from the Battle DB to ensure single source of truth
  const problem = await battlePrisma.battleProblem.findUnique({
    where: { id: problemId }
  });

  if (!problem) throw new Error("Problem not found");

  const { functionName, returnType, paramTypes, paramNames, comparisonMode } = problem;

  // Notify: execution started
  emitExecutionEvent(roomId, uuid, "execution:status", {
    jobId,
    problemId,
    status: "COMPILING",
    message: "Preparing execution environment..."
  });

  try {
    // Generate harness based on language
    let fullSource = code;
    
    // Fallback: If it's C++, we can use the CppRunner to generate the harness
    if (language.toLowerCase() === "cpp") {
      fullSource = CppRunner.generateHarness(code, functionName, returnType, paramTypes, paramNames);
    } else {
      fullSource = Judge0Runner.generateHarness(code, language, functionName, returnType, paramTypes, paramNames);
    }

    emitExecutionEvent(roomId, uuid, "execution:status", {
      jobId,
      problemId,
      status: "COMPILED",
      message: "Ready. Running tests..."
    });

    const stdinParts = [testCases.length.toString()];
    for (const tc of testCases) {
      stdinParts.push(CppRunner.generateStdin(tc.input, paramNames).trimEnd());
    }
    const stdinInput = stdinParts.join("\n") + "\n";

    emitExecutionEvent(roomId, uuid, "execution:status", {
      jobId,
      problemId,
      status: "RUNNING",
      message: "Running tests..."
    });

    let runResult;
    if (language.toLowerCase() === 'cpp') {
      const workDir = await CppRunner.createWorkDir();
      try {
        const compRes = await CppRunner.compile(fullSource, workDir);
        if (!compRes.success) {
           runResult = {
             success: false,
             status: "COMPILE_ERROR",
             error: compRes.error,
             runtimeMs: 0
           };
        } else {
           // Retry once for TLE to bypass MacOS Gatekeeper cold start delays
           for (let attempt = 1; attempt <= 2; attempt++) {
             runResult = await CppRunner.run(
               compRes.executablePath, 
               stdinInput,
               testCases[0]?.timeLimitMs || 2000,
               testCases[0]?.memoryLimitMb || 256
             );
             if (runResult.status !== "TIME_LIMIT_EXCEEDED") break;
           }
        }
      } finally {
        await CppRunner.cleanupWorkDir(workDir);
      }
    } else {
      // Retry once for Javascript/Python cold starts
      for (let attempt = 1; attempt <= 2; attempt++) {
        runResult = await LocalRunner.run(
          fullSource,
          language,
          stdinInput,
          testCases[0]?.timeLimitMs || 2000,
          testCases[0]?.memoryLimitMb || 256
        );
        if (runResult.status !== "TIME_LIMIT_EXCEEDED") break;
      }
    }

    const stdoutLines = (runResult.stdout || "")
      .split("\n")
      .map(s => s.trim())
      .filter(s => s !== "");

    const results = [];
    let allPassed = true;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      let testStatus;
      let testMessage = null;
      let testActual = null;

      if (!runResult.success && i >= stdoutLines.length) {
        if (i === stdoutLines.length) {
          testStatus = runResult.status;
          testMessage = runResult.error || (runResult.status === "RUNTIME_ERROR" ? "Runtime Error" : runResult.status.replace(/_/g, " "));
        } else {
          testStatus = "SKIPPED";
          testMessage = "Skipped due to previous failure";
        }
        testActual = "null";
        allPassed = false;
      } else if (i < stdoutLines.length) {
        const actualOutput = JudgeService.parseOutput(stdoutLines[i]);
        testActual = actualOutput;
        const comparison = JudgeService.compare(actualOutput, tc.expected, comparisonMode || "exact");

        if (comparison.passed) {
          testStatus = "PASSED";
        } else {
          testStatus = "WRONG_ANSWER";
          testMessage = comparison.message;
          allPassed = false;
        }
      } else {
        // Fallback if stdout is missing but runResult claims success (e.g., user forgot to return anything or printed empty)
        testStatus = "WRONG_ANSWER";
        testMessage = "Missing output";
        testActual = "null";
        allPassed = false;
      }

      const testResult = {
        testIndex: i,
        testOrder: tc.order,
        isPublic: tc.isPublic,
        status: testStatus,
        runtimeMs: runResult.runtimeMs,
        message: testMessage,
        ...(tc.isPublic ? {
          input: tc.input,
          expected: tc.expected,
          actual: testActual
        } : {})
      };

      results.push(testResult);

      emitExecutionEvent(roomId, uuid, "execution:test-update", {
        jobId,
        problemId,
        ...testResult,
        totalTests: testCases.length
      });

      if (mode === "SUBMIT" && !allPassed) {
        for (let j = i + 1; j < testCases.length; j++) {
          const skipTc = testCases[j];
          const skipResult = {
            testIndex: j,
            testOrder: skipTc.order,
            isPublic: skipTc.isPublic,
            status: "SKIPPED",
            runtimeMs: 0,
            message: "Skipped due to previous failure",
            ...(skipTc.isPublic ? {
              input: skipTc.input,
              expected: skipTc.expected,
              actual: "null"
            } : {})
          };
          results.push(skipResult);
          emitExecutionEvent(roomId, uuid, "execution:test-update", {
             jobId, problemId, ...skipResult, totalTests: testCases.length
          });
        }
        break;
      }
    }

    // Final verdict
    const passedCount = results.filter(r => r.status === "PASSED").length;
    const totalCount = testCases.length;
    let finalStatus = allPassed ? "ACCEPTED" : "WRONG_ANSWER";
    if (results.some(r => r.status === "SERVICE_UNAVAILABLE")) {
      finalStatus = "SERVICE_UNAVAILABLE";
    } else if (results.some(r => r.status === "COMPILE_ERROR")) {
      finalStatus = "COMPILE_ERROR";
    } else if (results.some(r => r.status === "RUNTIME_ERROR")) {
      finalStatus = "RUNTIME_ERROR";
    } else if (results.some(r => r.status === "TIME_LIMIT_EXCEEDED")) {
      finalStatus = "TIME_LIMIT_EXCEEDED";
    }
    const maxRuntime = Math.max(...results.filter(r => r.runtimeMs).map(r => r.runtimeMs), 0);

    // Update score if it's a SUBMIT
    if (mode === "SUBMIT") {
      try {
        const { BattleRoomStore } = await import("../battle/battle.room.js");
        const updatedPlayer = await BattleRoomStore.updatePlayerScore(
          roomId,
          participantId,
          problemId,
          passedCount
        );
        
        if (updatedPlayer) {
          // You could optionally emit a score update event here, 
          // but the client will also poll or receive updates through other means.
          emitExecutionEvent(roomId, uuid, "battle:score-updated", {
            participantId,
            totalScore: updatedPlayer.totalScore
          });

          // Centralized finish logic
          const { BattleService } = await import("../battle/battle.service.js");
          await BattleService.checkAndFinalizeBattle(roomId, ioInstance ? ioInstance.of("/battle") : null);
        }
      } catch (err) {
        console.error("Failed to update player score:", err);
      }
    }

    emitExecutionEvent(roomId, uuid, "execution:completed", {
      jobId,
      problemId,
      status: finalStatus,
      passed: passedCount,
      total: totalCount,
      maxRuntimeMs: maxRuntime,
      mode,
      cases: results
    });

    return {
      success: allPassed,
      status: finalStatus,
      testResults: {
        passed: passedCount,
        total: totalCount,
        maxRuntimeMs: maxRuntime,
        cases: results
      }
    };
  } catch (err) {
    console.error("Job processing error:", err);
    emitExecutionEvent(roomId, uuid, "execution:status", {
      jobId,
      problemId,
      status: "EXECUTION_ERROR",
      message: err.message || "An unexpected error occurred during execution."
    });
    return {
      success: false,
      status: "ERROR",
      message: err.message
    };
  }
}

/**
 * Start the execution worker.
 * Call this once during server startup.
 */
export function startExecutionWorker() {
  const connection = parseRedisUrl(REDIS_URL);

  const worker = new Worker("code-execution", processJob, {
    connection,
    concurrency: 3, // Process up to 3 jobs simultaneously
    limiter: {
      max: 10,
      duration: 60000 // Max 10 jobs per minute
    }
  });

  worker.on("completed", (job, result) => {
    console.log(`[ExecutionWorker] Job ${job.id} completed: ${result.status}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[ExecutionWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[ExecutionWorker] Started with concurrency=3");

  return worker;
}
