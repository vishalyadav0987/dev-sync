const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// 1. SessionProblem
schema = schema.replace(
  /problem\s+Problem\s+@relation\(fields:\s*\[problemId\],\s*references:\s*\[id\]\)/,
  'problem     Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)'
);

// 2. MistakeReview
schema = schema.replace(
  /problem\s+Problem\s+@relation\(fields:\s*\[problemId\],\s*references:\s*\[id\]\)/,
  'problem         Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)'
);

// 3. VisualizationHistory
schema = schema.replace(
  /problemId\s+String\n\s+lastStep/,
  'problemId            String\n  problem              Problem      @relation(fields: [problemId], references: [id], onDelete: Cascade)\n  lastStep'
);

// 4. StepBookmark
schema = schema.replace(
  /problemId\s+String\n\s+stepId/,
  'problemId String\n  problem   Problem      @relation(fields: [problemId], references: [id], onDelete: Cascade)\n  stepId'
);

// 5. Note
schema = schema.replace(
  /problem\s+Problem\?\s+@relation\(fields:\s*\[problemId\],\s*references:\s*\[id\],\s*onDelete:\s*SetNull\)/,
  'problem         Problem?      @relation(fields: [problemId], references: [id], onDelete: Cascade)'
);

// 6. ExtensionSubmission
schema = schema.replace(
  /problemSlug\s+String\n\s+problemTitle\s+String/,
  'problemSlug           String\n  problemId             String?\n  problem               Problem?     @relation(fields: [problemId], references: [id], onDelete: Cascade)\n  problemTitle          String'
);

// Add missing back-relations to Problem
schema = schema.replace(
  /mistakeReviews\s+MistakeReview\[\]\n/,
  'mistakeReviews  MistakeReview[]\n  extensionSubmissions ExtensionSubmission[]\n  visualizationHistories VisualizationHistory[]\n  stepBookmarks StepBookmark[]\n  userProgress UserProblemProgress[]\n'
);

// Add GuestSession back-relation for UserProblemProgress
schema = schema.replace(
  /notifications\s+Notification\[\]\n}/,
  'notifications        Notification[]\n  userProblemProgress  UserProblemProgress[]\n}'
);


// 7. Create UserProblemProgress
if (!schema.includes('UserProblemProgress')) {
  schema += `
// ── User Problem Progress ────────────────────────────────────────
model UserProblemProgress {
  id                      String       @id @default(uuid())
  guestId                 String
  guest                   GuestSession @relation(fields: [guestId], references: [id], onDelete: Cascade)
  problemId               String
  problem                 Problem      @relation(fields: [problemId], references: [id], onDelete: Cascade)
  status                  String       @default("SOLVED")
  firstAcceptedAt         DateTime     @default(now())
  firstAcceptedSubmissionId String

  @@unique([guestId, problemId])
  @@index([guestId])
  @@index([problemId])
}
`;
}

fs.writeFileSync('prisma/schema.prisma', schema);
