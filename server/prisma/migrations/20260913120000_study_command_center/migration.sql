-- Study Command Center: workspace fields + mistake review + activity timeline

ALTER TABLE "StudySession"
  ADD COLUMN "currentProblemId" TEXT,
  ADD COLUMN "reflection"       TEXT,
  ADD COLUMN "confidence"       INTEGER;

ALTER TABLE "SessionProblem"
  ADD COLUMN "stage"      TEXT NOT NULL DEFAULT 'understanding',
  ADD COLUMN "attempts"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "hintsUsed"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "confidence" INTEGER;

CREATE TABLE "MistakeReview" (
  "id"             TEXT NOT NULL,
  "sessionId"      TEXT NOT NULL,
  "problemId"      TEXT NOT NULL,
  "guestId"        TEXT NOT NULL,
  "mistake"        TEXT NOT NULL,
  "reason"         TEXT,
  "correctConcept" TEXT,
  "confidence"     INTEGER,
  "isReviewed"     BOOLEAN NOT NULL DEFAULT false,
  "reviewedAt"     TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MistakeReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MistakeReview_sessionId_idx" ON "MistakeReview"("sessionId");
CREATE INDEX "MistakeReview_guestId_idx" ON "MistakeReview"("guestId");
CREATE INDEX "MistakeReview_guestId_isReviewed_idx" ON "MistakeReview"("guestId", "isReviewed");

ALTER TABLE "MistakeReview"
  ADD CONSTRAINT "MistakeReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MistakeReview_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MistakeReview_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SessionActivity" (
  "id"        TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "guestId"   TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SessionActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SessionActivity_sessionId_idx" ON "SessionActivity"("sessionId");
CREATE INDEX "SessionActivity_guestId_createdAt_idx" ON "SessionActivity"("guestId", "createdAt");

ALTER TABLE "SessionActivity"
  ADD CONSTRAINT "SessionActivity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
