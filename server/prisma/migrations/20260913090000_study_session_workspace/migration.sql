-- Extend StudySession with planning/progress/lifecycle fields
ALTER TABLE "StudySession"
  ADD COLUMN "description"         TEXT,
  ADD COLUMN "category"            TEXT,
  ADD COLUMN "goalLabel"           TEXT,
  ADD COLUMN "targetProblems"      INTEGER,
  ADD COLUMN "targetMinutes"       INTEGER,
  ADD COLUMN "difficulty"          TEXT NOT NULL DEFAULT 'MIXED',
  ADD COLUMN "focusMode"           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status"              TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "isFavorite"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "totalFocusedSeconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "startedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "completedAt"         TIMESTAMP(3);

CREATE INDEX "StudySession_guestId_status_idx" ON "StudySession"("guestId", "status");

-- Session problem queue
CREATE TABLE "SessionProblem" (
  "id"          TEXT NOT NULL,
  "sessionId"   TEXT NOT NULL,
  "problemId"   TEXT NOT NULL,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "status"      TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "startedAt"   TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "timeSpent"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SessionProblem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SessionProblem_sessionId_problemId_key" ON "SessionProblem"("sessionId", "problemId");
CREATE INDEX "SessionProblem_sessionId_idx" ON "SessionProblem"("sessionId");
CREATE INDEX "SessionProblem_problemId_idx" ON "SessionProblem"("problemId");

ALTER TABLE "SessionProblem"
  ADD CONSTRAINT "SessionProblem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "SessionProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
