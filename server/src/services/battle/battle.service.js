import crypto from "crypto";
import { BattleRoomStore } from "./battle.room.js";
import { getOrCreateParticipant } from "../chat/chat.service.js";
import { redisClient, BATTLE_KEYS } from "./battle.redis.js";
import { ExecutionService } from "../execution/execution.service.js";
import battlePrisma from "../../lib/battlePrisma.js";

// Main portfolio Prisma client (for BattleResult, GuestSession)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function generateRoomId() {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars like A1B2C3
}

export class BattleService {
  /**
   * Retrieves all available waiting rooms
   */
  static async getWaitingRooms() {
    const roomIds = await redisClient.smembers(BATTLE_KEYS.waitingRooms());
    if (!roomIds || roomIds.length === 0) return [];

    const availableRooms = [];
    const staleIds = [];
    const problemIdsToFetch = new Set();
    const parsedRooms = [];

    for (const roomId of roomIds) {
      const room = await BattleRoomStore.getRoom(roomId);
      if (!room || room.status !== "WAITING") {
        staleIds.push(roomId);
        continue;
      }

      const players = await BattleRoomStore.getPlayers(roomId);
      if (players.length >= room.maxPlayers) {
        staleIds.push(roomId);
        continue;
      }
      
      if (room.problemIds && room.problemIds.length > 0) {
         problemIdsToFetch.add(room.problemIds[0]);  // These are now BattleProblem IDs
      }

      parsedRooms.push({ room, players });
    }

    // Cleanup stale rooms
    if (staleIds.length > 0) {
      await redisClient.srem(BATTLE_KEYS.waitingRooms(), ...staleIds);
    }
    
    if (parsedRooms.length === 0) return [];

    const problems = await battlePrisma.battleProblem.findMany({
      where: { id: { in: Array.from(problemIdsToFetch) } },
      select: { id: true, title: true, difficulty: true }
    });
    const problemMap = new Map(problems.map(p => [p.id, p]));

    for (const { room, players } of parsedRooms) {
      const host = players.find(p => p.participantId === room.hostParticipantId);
      const firstProblemId = room.problemIds && room.problemIds[0];
      
      availableRooms.push({
        roomId: room.roomId,
        hostParticipantId: room.hostParticipantId, // needed for UI logic (to disable join if self)
        host: {
          displayName: host ? host.displayName : "Anonymous",
          avatar: host ? host.avatar : null
        },
        problem: firstProblemId ? problemMap.get(firstProblemId) : null,
        currentPlayers: players.length,
        maxPlayers: room.maxPlayers,
        status: room.status
      });
    }

    return availableRooms;
  }
  /**
   * Creates a new Battle Room
   */
  static async createBattle({ uuid, problemIds, maxPlayers, durationMinutes = 30 }) {
    if (!uuid || !problemIds || !Array.isArray(problemIds) || problemIds.length === 0 || !maxPlayers) throw new Error("Missing required fields");
    
    // Validate UUID and get participant identity
    const participant = await getOrCreateParticipant(uuid);
    
    // Verify problems exist in the BATTLE database
    const problems = await battlePrisma.battleProblem.findMany({
      where: { id: { in: problemIds } },
      select: { id: true, title: true, difficulty: true }
    });
    
    if (problems.length !== problemIds.length) throw new Error("Some battle problems not found");
    
    const roomId = generateRoomId();
    
    const room = await BattleRoomStore.createRoom({
      roomId,
      hostParticipantId: participant.participantId,
      problemIds: problems.map(p => p.id),
      maxPlayers,
      durationMinutes
    });
    
    return {
      roomId: room.roomId,
      problems,
      maxPlayers: room.maxPlayers,
      durationMinutes: room.durationMinutes,
      status: room.status,
      host: participant.displayName,
    };
  }

  /**
   * Gets Battle Room Data for API response
   */
  static async getBattle(roomId) {
    const room = await BattleRoomStore.getRoom(roomId);
    if (!room) throw new Error("Battle not found");
    
    // Fetch problems from BATTLE DB with only PUBLIC test cases
    const problemsRaw = await battlePrisma.battleProblem.findMany({
      where: { id: { in: room.problemIds } },
      include: {
        testCases: {
          where: { isPublic: true },
          orderBy: { order: "asc" }
        }
      }
    });

    // Get total test case counts per problem (for UI "X/12 passed")
    const problems = await Promise.all(problemsRaw.map(async (p) => {
      const totalTestCases = await battlePrisma.battleTestCase.count({
        where: { problemId: p.id }
      });
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        statement: p.statement,
        constraints: p.constraints,
        starterCode: p.starterCode,
        language: p.language,
        functionName: p.functionName,
        returnType: p.returnType,
        paramTypes: p.paramTypes,
        paramNames: p.paramNames,
        tags: p.tags,
        category: p.category,
        testCases: p.testCases.map(tc => ({
          id: tc.id,
          input: tc.input,
          expected: tc.expected,
          order: tc.order,
          isPublic: true
        })),
        totalTestCases
      };
    }));

    const players = await BattleRoomStore.getPlayers(roomId);

    let rankings = null;
    if (room.status === "FINISHED" || room.status === "EXPIRED") {
      const battleResult = await prisma.battleResult.findUnique({
        where: { roomId }
      });
      if (battleResult && battleResult.players) {
        rankings = battleResult.players;
      }
    }

    return {
      room,
      problems,
      players,
      rankings
    };
  }

  /**
   * Fetches paginated problems for the battle create modal — from Battle DB
   */
  static async getProblems({ page = 1, limit = 20, search = "", difficulty = "" }) {
    return ExecutionService.searchProblems({ page, limit, search, difficulty });
  }

  /**
   * Starts a battle, entering COUNTDOWN state, then ACTIVE
   */
  static async startBattle(roomId, participantId, ioNamespace) {
    const room = await BattleRoomStore.getRoom(roomId);
    if (!room) throw new Error("Battle not found");

    if (room.hostParticipantId !== participantId) {
      throw new Error("Only the host can start the battle");
    }

    if (room.status !== "READY" && room.status !== "WAITING") {
      throw new Error("Room cannot be started in its current state");
    }

    const players = await BattleRoomStore.getPlayers(roomId);
    // As long as there is at least 1 player and everyone joined is ready, host can start
    if (players.length === 0) {
      throw new Error("No players in the room");
    }

    const allReady = players.every(p => p.ready);
    if (!allReady) {
      throw new Error("All joined players must be ready before starting");
    }

    // Transition to COUNTDOWN
    await BattleRoomStore.updateRoomStatus(roomId, "COUNTDOWN");
    ioNamespace.to(`battle:${roomId}`).emit("battle:countdown", { seconds: 3 });
    ioNamespace.emit("battle:waiting-updated");

    // 3, 2, 1, GO sequence
    let count = 2;
    const interval = setInterval(async () => {
      if (count > 0) {
        ioNamespace.to(`battle:${roomId}`).emit("battle:countdown", { seconds: count });
        count--;
      } else {
        clearInterval(interval);
        
        // Transition to ACTIVE
        await BattleRoomStore.updateRoomStatus(roomId, "ACTIVE");
        const updatedRoom = await BattleRoomStore.getRoom(roomId);
        
        ioNamespace.to(`battle:${roomId}`).emit("battle:started", {
          room: updatedRoom
        });
        
        // Enforce timer expiration logic
        const duration = room.durationMinutes ? room.durationMinutes * 60 : parseInt(process.env.BATTLE_DURATION_SECONDS || "1800", 10);
        setTimeout(async () => {
          // Check if it's still active (might have finished early)
          const currentRoom = await BattleRoomStore.getRoom(roomId);
          if (currentRoom && currentRoom.status === "ACTIVE") {
            const rankings = await BattleService.computeRankings(roomId);
            const winnerPid = rankings.length > 0 && rankings[0].solvedCount > 0 ? rankings[0].participantId : null;
            await BattleService.finalizeBattle(roomId, { status: "EXPIRED", winnerParticipantId: winnerPid, rankings });
            const finalRoom = await BattleRoomStore.getRoom(roomId);
            ioNamespace.to(`battle:${roomId}`).emit("battle:results", { 
              room: finalRoom, 
              rankings 
            });
          }
        }, duration * 1000);
      }
    }, 1000);

    return true;
  }

  /**
   * Computes rankings for all players in a battle room.
   * Sort by: problems solved (desc) → finish time (asc, null = Infinity)
   */
  static async computeRankings(roomId) {
    const room = await BattleRoomStore.getRoom(roomId);
    if (!room) return [];

    const players = await BattleRoomStore.getPlayers(roomId);
    const totalProblems = room.problemIds ? room.problemIds.length : 0;
    const startedAt = room.startedAt || Date.now();

    const ranked = players.map(p => {
      const solvedCount = p.solvedProblems ? p.solvedProblems.length : 0;
      // finishedAt is the timestamp when this player completed all problems
      const finishTimeMs = p.finishedAt ? (p.finishedAt - startedAt) : null;
      const finishTimeSec = finishTimeMs ? Math.round(finishTimeMs / 1000) : null;

      return {
        participantId: p.participantId,
        uuid: p.uuid,
        displayName: p.displayName,
        solvedCount,
        totalProblems,
        finishTimeSec, // null if they didn't finish all problems
        status: p.status,
      };
    });

    // Sort: most problems solved first, then fastest finish time
    ranked.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      // Both have same solve count. If both finished, compare times (lower = better)
      const aTime = a.finishTimeSec ?? Infinity;
      const bTime = b.finishTimeSec ?? Infinity;
      return aTime - bTime;
    });

    // Assign rank numbers
    ranked.forEach((p, i) => { p.rank = i + 1; });

    return ranked;
  }

  /**
   * Finalizes the battle and persists the outcome to PostgreSQL
   */
  static async finalizeBattle(roomId, { status = "FINISHED", winnerParticipantId = null, rankings = [] }) {
    try {
      const room = await BattleRoomStore.getRoom(roomId);
      if (!room) return null;

      // Check for idempotency
      const existing = await prisma.battleResult.findUnique({
        where: { roomId }
      });
      if (existing) return existing;

      // Update terminal state in Redis if not already updated
      if (room.status !== status) {
        await BattleRoomStore.updateRoomStatus(roomId, status);
      }

      const players = await BattleRoomStore.getPlayers(roomId);
      
      // Determine winner uuid
      let winnerId = null;
      if (winnerParticipantId) {
        const winner = players.find(p => p.participantId === winnerParticipantId);
        if (winner) winnerId = winner.uuid;
      }

      const startedAt = room.startedAt ? new Date(room.startedAt) : null;
      const finishedAt = new Date();

      let durationSeconds = null;
      if (startedAt) {
        durationSeconds = Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000);
      }

      // Snapshot players with ranking data
      const sanitizedPlayers = rankings.length > 0
        ? rankings.map(r => ({
            participantId: r.participantId,
            uuid: r.uuid,
            displayName: r.displayName,
            rank: r.rank,
            solvedCount: r.solvedCount,
            totalProblems: r.totalProblems,
            finishTimeSec: r.finishTimeSec,
            isWinner: r.rank === 1 && r.solvedCount > 0
          }))
        : players.map(p => ({
            participantId: p.participantId,
            uuid: p.uuid,
            displayName: p.displayName,
            rank: null,
            solvedCount: p.solvedProblems ? p.solvedProblems.length : 0,
            totalProblems: room.problemIds ? room.problemIds.length : 0,
            finishTimeSec: null,
            isWinner: p.participantId === winnerParticipantId
          }));

      const battleResult = await prisma.battleResult.create({
        data: {
          roomId,
          battleProblemIds: room.problemIds || [],
          winnerId,
          maxPlayers: room.maxPlayers,
          status: status === "EXPIRED" && winnerId ? "FINISHED" : status,
          startedAt,
          finishedAt,
          durationSeconds,
          players: sanitizedPlayers
        }
      });

      return battleResult;
    } catch (e) {
      console.error("[BattleService] Failed to finalize battle", e);
      const existing = await prisma.battleResult.findUnique({
        where: { roomId }
      });
      return existing || null;
    }
  }

  /**
   * Called when ALL players have finished. Ends the battle early with rankings.
   */
  static async endBattleEarly(roomId, ioNamespace) {
    const rankings = await this.computeRankings(roomId);
    const winnerPid = rankings.length > 0 && rankings[0].solvedCount > 0 ? rankings[0].participantId : null;
    await this.finalizeBattle(roomId, { status: "FINISHED", winnerParticipantId: winnerPid, rankings });
    const finalRoom = await BattleRoomStore.getRoom(roomId);
    ioNamespace.to(`battle:${roomId}`).emit("battle:results", {
      room: finalRoom,
      rankings
    });
  }

  /**
   * Retrieves the global leaderboard and recent battle history
   */
  static async getGlobalLeaderboard() {
    try {
      const [topPlayers, recentBattlesRaw] = await Promise.all([
        // Top 50 players by wonBattles count
        prisma.guestSession.findMany({
          include: {
            _count: {
              select: { wonBattles: true }
            }
          },
          orderBy: {
            wonBattles: {
              _count: 'desc'
            }
          },
          take: 50,
        }),
        
        // Recent 20 finished battles
        prisma.battleResult.findMany({
          where: {
            status: "FINISHED"
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20,
          include: {
            winner: {
              select: {
                displayName: true
              }
            }
          }
        })
      ]);

      // Enrich recent battles with problem titles from battle DB
      const allProblemIds = [...new Set(recentBattlesRaw.flatMap(b => b.battleProblemIds || []))];
      const battleProblems = allProblemIds.length > 0 ? await battlePrisma.battleProblem.findMany({
        where: { id: { in: allProblemIds } },
        select: { id: true, title: true, difficulty: true }
      }) : [];
      const bpMap = new Map(battleProblems.map(p => [p.id, p]));

      const recentBattles = recentBattlesRaw.map(b => ({
        ...b,
        problems: (b.battleProblemIds || []).map(pid => bpMap.get(pid)).filter(Boolean)
      }));

      // Map players to a cleaner format
      const leaderboard = topPlayers
        .map(p => ({
          id: p.id,
          displayName: p.displayName,
          wins: p._count.wonBattles,
          longestStreak: p.longestStreak
        }));

      return {
        leaderboard,
        recentBattles
      };
    } catch (e) {
      console.error("[BattleService] Failed to get global leaderboard", e);
      return { leaderboard: [], recentBattles: [] };
    }
  }

  /**
   * Retrieves rich battle stats for a specific user
   */
  static async getUserBattleStats(guestId) {
    try {
      const guest = await prisma.guestSession.findUnique({
        where: { id: guestId },
        include: {
          _count: {
            select: { wonBattles: true }
          }
        }
      });

      if (!guest) {
        return null;
      }

      // Fetch all battles where this user was a participant
      const battles = await prisma.$queryRaw`
        SELECT * FROM "BattleResult" 
        WHERE "status" IN ('FINISHED', 'EXPIRED') 
          AND players::text LIKE ${'%' + guestId + '%'}
        ORDER BY "createdAt" DESC
      `;

      const battleIds = battles.map(b => b.id);
      
      const fullBattlesRaw = await prisma.battleResult.findMany({
        where: {
          id: { in: battleIds }
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          winner: {
            select: {
              id: true,
              displayName: true
            }
          }
        }
      });

      // Enrich with problem titles from battle DB
      const allPids = [...new Set(fullBattlesRaw.flatMap(b => b.battleProblemIds || []))];
      const bProblems = allPids.length > 0 ? await battlePrisma.battleProblem.findMany({
        where: { id: { in: allPids } },
        select: { id: true, title: true, difficulty: true }
      }) : [];
      const bpLookup = new Map(bProblems.map(p => [p.id, p]));

      const fullBattles = fullBattlesRaw.map(b => ({
        ...b,
        problems: (b.battleProblemIds || []).map(pid => bpLookup.get(pid)).filter(Boolean)
      }));

      const totalMatches = fullBattles.length;
      const totalWins = guest._count.wonBattles;
      const totalLosses = totalMatches - totalWins;
      const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

      // ── Problems solved by difficulty ──
      const difficultyStats = { EASY: 0, MEDIUM: 0, HARD: 0 };
      let totalProblemsSolved = 0;
      for (const battle of fullBattles) {
        const didWin = battle.winnerId === guestId;
        if (didWin) {
          for (const p of battle.problems) {
            difficultyStats[p.difficulty] = (difficultyStats[p.difficulty] || 0) + 1;
            totalProblemsSolved++;
          }
        }
      }

      // ── Solve times ──
      const solveTimes = fullBattles
        .filter(b => b.winnerId === guestId && b.durationSeconds > 0)
        .map(b => b.durationSeconds);
      
      const avgSolveTime = solveTimes.length > 0 
        ? Math.round(solveTimes.reduce((a, b) => a + b, 0) / solveTimes.length) 
        : null;
      const fastestSolve = solveTimes.length > 0 
        ? Math.min(...solveTimes) 
        : null;

      // ── Activity heatmap (last 90 days) ──
      const activityMap = {};
      const now = new Date();
      for (const battle of fullBattles) {
        const d = new Date(battle.createdAt);
        const daysDiff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 90) {
          const dateKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
          activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
        }
      }

      // ── Current streak (consecutive days with battles, counting backwards) ──
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0,0,0,0);
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const key = checkDate.toISOString().split('T')[0];
        if (activityMap[key]) {
          currentStreak++;
        } else if (i > 0) {
          break; // gap found
        }
        // If today has no activity, streak is 0 but we still check yesterday
        if (i === 0 && !activityMap[key]) {
          // check if yesterday has activity
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yKey = yesterday.toISOString().split('T')[0];
          if (!activityMap[yKey]) break;
        }
      }

      // ── Battle Rating / XP ──
      // Formula: 100 per win + 25 per participation + 50 bonus for hard wins + 25 for medium wins
      let battleXP = 0;
      for (const battle of fullBattles) {
        const didWin = battle.winnerId === guestId;
        battleXP += 25; // participation
        if (didWin) {
          battleXP += 100; // win bonus
          for (const p of battle.problems) {
            if (p.difficulty === 'HARD') battleXP += 50;
            else if (p.difficulty === 'MEDIUM') battleXP += 25;
          }
        }
      }

      // ── Level system ──
      const LEVEL_THRESHOLDS = [
        { level: 1, xp: 0, title: 'Novice' },
        { level: 2, xp: 100, title: 'Contender' },
        { level: 3, xp: 250, title: 'Duelist' },
        { level: 4, xp: 500, title: 'Code Warrior' },
        { level: 5, xp: 1000, title: 'Elite' },
        { level: 6, xp: 1500, title: 'Master' },
        { level: 7, xp: 2500, title: 'Grandmaster' },
      ];
      let playerLevel = LEVEL_THRESHOLDS[0];
      let nextLevel = LEVEL_THRESHOLDS[1];
      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (battleXP >= LEVEL_THRESHOLDS[i].xp) {
          playerLevel = LEVEL_THRESHOLDS[i];
          nextLevel = LEVEL_THRESHOLDS[i + 1] || null;
          break;
        }
      }

      // ── Achievements ──
      const achievements = [];
      if (totalWins >= 1) achievements.push({ id: 'first_victory', name: 'First Victory', icon: '🏆', unlocked: true });
      else achievements.push({ id: 'first_victory', name: 'First Victory', icon: '🏆', unlocked: false });

      if (guest.longestStreak >= 7) achievements.push({ id: 'week_streak', name: '7 Day Streak', icon: '🔥', unlocked: true });
      else achievements.push({ id: 'week_streak', name: '7 Day Streak', icon: '🔥', unlocked: false });

      if (fastestSolve !== null && fastestSolve < 300) achievements.push({ id: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: 'Solved under 5 minutes', unlocked: true });
      else achievements.push({ id: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: 'Solve under 5 minutes', unlocked: false });

      if (totalMatches >= 10) achievements.push({ id: 'ten_battles', name: '10 Battles', icon: '🎯', unlocked: true });
      else achievements.push({ id: 'ten_battles', name: '10 Battles', icon: '🎯', unlocked: false });

      if (difficultyStats.HARD > 0) achievements.push({ id: 'hard_winner', name: 'Hard Mode Winner', icon: '💎', unlocked: true });
      else achievements.push({ id: 'hard_winner', name: 'Hard Mode Winner', icon: '💎', unlocked: false });

      // 5 win streak check
      let maxConsecWins = 0, consecWins = 0;
      for (const battle of [...fullBattles].reverse()) {
        if (battle.winnerId === guestId) { consecWins++; maxConsecWins = Math.max(maxConsecWins, consecWins); }
        else { consecWins = 0; }
      }
      if (maxConsecWins >= 5) achievements.push({ id: 'five_streak', name: '5 Win Streak', icon: '👑', unlocked: true });
      else achievements.push({ id: 'five_streak', name: '5 Win Streak', icon: '👑', unlocked: false });

      if (totalMatches >= 50) achievements.push({ id: 'veteran', name: 'Veteran', icon: '🛡️', desc: '50+ battles', unlocked: true });
      else achievements.push({ id: 'veteran', name: 'Veteran', icon: '🛡️', desc: 'Play 50 battles', unlocked: false });

      // ── Leaderboard rank ──
      // Count how many users have more wins
      const rankResult = await prisma.$queryRaw`
        SELECT COUNT(*) + 1 as rank FROM "GuestSession" g
        WHERE (SELECT COUNT(*) FROM "BattleResult" WHERE "winnerId" = g.id) > ${totalWins}
      `;
      const leaderboardRank = Number(rankResult[0]?.rank || 0);

      return {
        profile: {
          id: guest.id,
          displayName: guest.displayName,
          longestStreak: guest.longestStreak,
          currentStreak,
          createdAt: guest.createdAt
        },
        stats: {
          totalMatches,
          totalWins,
          totalLosses,
          winRate,
          totalProblemsSolved,
          avgSolveTime,
          fastestSolve,
          difficultyStats,
          battleXP,
          level: playerLevel,
          nextLevel,
          leaderboardRank,
          maxConsecWins
        },
        achievements,
        activityMap,
        history: fullBattles
      };
    } catch (e) {
      console.error("[BattleService] Failed to get user battle stats", e);
      throw new Error("Failed to fetch user stats");
    }
  }
}

