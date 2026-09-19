/**
 * Execution Service — Main entry point for code execution.
 * 
 * Coordinates between:
 *   - Battle routes (run/submit requests)
 *   - BullMQ queue (job scheduling)
 *   - Execution worker (actual compilation/execution)
 *   - Socket.IO (real-time status updates)
 *
 * Usage:
 *   ExecutionService.submitRun({ roomId, uuid, problemId, code, language })
 *   ExecutionService.submitSubmission({ roomId, uuid, problemId, code, language })
 */

import crypto from "crypto";
import battlePrisma from "../../lib/battlePrisma.js";
import { addExecutionJob } from "./execution.queue.js";

export class ExecutionService {
  /**
   * Submit a "Run" request — only runs public test cases.
   */
  static async submitRun({ roomId, uuid, participantId, problemId, code, language }) {
    const problem = await battlePrisma.battleProblem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          where: { isPublic: true },
          orderBy: { order: "asc" }
        }
      }
    });

    if (!problem) throw new Error("Problem not found");

    const jobId = `run_${crypto.randomUUID()}`;

    const jobData = {
      jobId,
      roomId,
      uuid,
      participantId,
      problemId,
      code,
      language,
      mode: "RUN",
      problemMeta: {
        functionName: problem.functionName,
        returnType: problem.returnType,
        paramTypes: problem.paramTypes,
        paramNames: problem.paramNames,
      },
      testCases: problem.testCases.map(tc => ({
        id: tc.id,
        input: tc.input,
        expected: tc.expected,
        isPublic: tc.isPublic,
        order: tc.order,
        timeLimitMs: tc.timeLimitMs,
        memoryLimitMb: tc.memoryLimitMb,
      }))
    };

    await addExecutionJob(jobData);

    return { jobId, testCount: problem.testCases.length };
  }

  /**
   * Submit a "Submit" request — runs ALL test cases (public + hidden).
   */
  static async submitSubmission({ roomId, uuid, participantId, problemId, code, language }) {
    const problem = await battlePrisma.battleProblem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          orderBy: { order: "asc" }
        }
      }
    });

    if (!problem) throw new Error("Problem not found");

    const jobId = `submit_${crypto.randomUUID()}`;

    const jobData = {
      jobId,
      roomId,
      uuid,
      participantId,
      problemId,
      code,
      language,
      mode: "SUBMIT",
      problemMeta: {
        functionName: problem.functionName,
        returnType: problem.returnType,
        paramTypes: problem.paramTypes,
        paramNames: problem.paramNames,
      },
      testCases: problem.testCases.map(tc => ({
        id: tc.id,
        input: tc.input,
        expected: tc.expected,
        isPublic: tc.isPublic,
        order: tc.order,
        timeLimitMs: tc.timeLimitMs,
        memoryLimitMb: tc.memoryLimitMb,
      }))
    };

    await addExecutionJob(jobData);

    return { jobId, testCount: problem.testCases.length };
  }

  /**
   * Get problem details with ONLY public test cases (for frontend display).
   */
  static async getProblemForFrontend(problemId) {
    const problem = await battlePrisma.battleProblem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          where: { isPublic: true },
          orderBy: { order: "asc" }
        }
      }
    });

    if (!problem) return null;

    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      statement: problem.statement,
      constraints: problem.constraints,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      starterCode: problem.starterCode,
      language: problem.language,
      tags: problem.tags,
      category: problem.category,
      testCases: problem.testCases.map(tc => ({
        id: tc.id,
        input: tc.input,
        expected: tc.expected,
        order: tc.order,
        isPublic: true
      })),
      // Total count includes hidden (for UI "X/12 passed")
      totalTestCases: await battlePrisma.battleTestCase.count({
        where: { problemId }
      })
    };
  }

  /**
   * Search/paginate battle problems for battle creation modal.
   */
  static async searchProblems({ page = 1, limit = 20, search = "", difficulty = "", category = "" }) {
    const where = { isPublished: true };

    if (difficulty && difficulty !== "ALL") {
      where.difficulty = difficulty;
    }
    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { tags: { has: search } }
      ];
    }

    const [problems, total] = await Promise.all([
      battlePrisma.battleProblem.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          category: true,
          tags: true,
          _count: { select: { testCases: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      battlePrisma.battleProblem.count({ where })
    ]);

    return {
      success: true,
      data: problems.map(p => ({
        ...p,
        testCaseCount: p._count.testCases,
        _count: undefined
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
