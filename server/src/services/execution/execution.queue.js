/**
 * Execution Queue — BullMQ-based job queue backed by Redis.
 * Prevents API server overload when multiple users submit simultaneously.
 */

import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Parse Redis URL for BullMQ connection
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

const connection = parseRedisUrl(REDIS_URL);

export const executionQueue = new Queue("code-execution", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 300 }, // Keep completed jobs for 5 minutes
    removeOnFail: { age: 600 },    // Keep failed jobs for 10 minutes
    attempts: 1,                    // No retries for code execution
  }
});

/**
 * Add a code execution job to the queue.
 * @param {Object} jobData
 * @param {string} jobData.jobId - Unique job identifier
 * @param {string} jobData.roomId - Battle room ID
 * @param {string} jobData.participantId - Participant who submitted
 * @param {string} jobData.uuid - Guest UUID
 * @param {string} jobData.problemId - BattleProblem ID
 * @param {string} jobData.code - User's source code
 * @param {string} jobData.language - Programming language
 * @param {string} jobData.mode - "RUN" or "SUBMIT"
 * @param {Object} jobData.problemMeta - { functionName, returnType, paramTypes, paramNames }
 * @param {Array} jobData.testCases - Array of test cases to run
 */
export async function addExecutionJob(jobData) {
  const job = await executionQueue.add("execute", jobData, {
    jobId: jobData.jobId,
    priority: jobData.mode === "SUBMIT" ? 1 : 2, // Submissions have higher priority
  });

  return job;
}
