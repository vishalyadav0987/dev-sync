import { prisma } from "../lib/prisma.js";
import { analyzeProblemWithGemini } from "./gemini.js";

/**
 * Fetches submission details (code, language, difficulty) from LeetCode.
 */
async function fetchSubmissionDetails(leetcodeSession, submissionId) {
  const detailsRes = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `LEETCODE_SESSION=${leetcodeSession}`
    },
    body: JSON.stringify({
      query: `query submissionDetails($id: Int!) {
        submissionDetails(submissionId: $id) {
          code
          lang { name }
          question { difficulty questionFrontendId questionId }
        }
      }`,
      variables: { id: parseInt(submissionId) }
    })
  });

  const detailsData = await detailsRes.json();
  return detailsData?.data?.submissionDetails;
}

/**
 * Saves a single problem to the database after Gemini analysis.
 */
async function saveProblemToDB(submission, submissionDetails, analysis) {
  // Create or find the category
  const categoryName = analysis.primaryCategory || "Uncategorized";
  const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: categoryName, slug: categorySlug, order: 99 }
    });
  }

  // Parse numeric IDs safely
  let leetcodeProblemId = null;
  if (submissionDetails.question?.questionFrontendId) {
    const parsed = parseInt(submissionDetails.question.questionFrontendId, 10);
    if (!isNaN(parsed) && parsed <= 2147483647) leetcodeProblemId = parsed;
  } else if (submissionDetails.question?.questionId) {
    const parsed = parseInt(submissionDetails.question.questionId, 10);
    if (!isNaN(parsed) && parsed <= 2147483647) leetcodeProblemId = parsed;
  }

  const difficultyVal = submissionDetails.question?.difficulty
    ? submissionDetails.question.difficulty.toUpperCase()
    : "MEDIUM";

  const problem = await prisma.problem.upsert({
    where: { slug: submission.titleSlug },
    update: {
      cppCode: submissionDetails.code || "",
      language: submissionDetails.lang?.name || "cpp",
      difficulty: difficultyVal,
      edgeCases: analysis.edgeCases || [],
      approachNotes: analysis.approachNotes || "",
      timeComplexity: analysis.timeComplexity || "",
      spaceComplexity: analysis.spaceComplexity || "",
      tags: analysis.tags || [],
      statement: analysis.statement || "",
      visualHtml: analysis.visualHtml || null,
      ...(leetcodeProblemId ? { leetcodeId: leetcodeProblemId } : {}),
      leetcodeUrl: `https://leetcode.com/problems/${submission.titleSlug}`,
    },
    create: {
      title: submission.title,
      slug: submission.titleSlug,
      difficulty: difficultyVal,
      cppCode: submissionDetails.code || "",
      language: submissionDetails.lang?.name || "cpp",
      edgeCases: analysis.edgeCases || [],
      approachNotes: analysis.approachNotes || "",
      timeComplexity: analysis.timeComplexity || "",
      spaceComplexity: analysis.spaceComplexity || "",
      tags: analysis.tags || [],
      statement: analysis.statement || "",
      visualHtml: analysis.visualHtml || null,
      categoryId: category.id,
      ...(leetcodeProblemId ? { leetcodeId: leetcodeProblemId } : {}),
      leetcodeUrl: `https://leetcode.com/problems/${submission.titleSlug}`,
    }
  });

  return problem;
}

/**
 * Synchronizes ALL missing Accepted submissions from LeetCode.
 * 
 * Logic:
 * 1. Fetch last 20 AC submissions from LeetCode.
 * 2. Check which ones are already in our DB (by slug).
 * 3. For each missing problem (oldest first), fetch code → analyze with Gemini → save.
 * 4. Returns count of newly synced problems.
 *
 * This handles the case where the user solved 3-4 problems while the app was offline.
 * If a problem already exists in DB, it appends the new solution as an approach.
 */
export async function syncLatestSubmissionForSession(leetcodeSession, lastSyncDate) {
  if (!leetcodeSession) {
    throw new Error("No LeetCode session provided.");
  }

  // 1. Fetch username and check connection
  const userRes = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `LEETCODE_SESSION=${leetcodeSession}`
    },
    body: JSON.stringify({
      query: `query { userStatus { username isSignedIn } }`
    })
  });

  const userData = await userRes.json();
  if (!userData?.data?.userStatus?.isSignedIn) {
    return { status: "EXPIRED", message: "Invalid or expired LEETCODE_SESSION cookie." };
  }
  const username = userData.data.userStatus.username;

  // 2. Fetch last 20 recent AC submissions (not just 1!)
  const recentRes = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `LEETCODE_SESSION=${leetcodeSession}`
    },
    body: JSON.stringify({
      query: `query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
        }
      }`,
      variables: { username, limit: 20 }
    })
  });

  const recentData = await recentRes.json();
  const submissions = recentData?.data?.recentAcSubmissionList;
  if (!submissions || submissions.length === 0) {
    return { status: "CONNECTED", message: "No recent accepted submissions found." };
  }

  // 3. Filter submissions to only those newer than our last sync (or last 24h if first time)
  let cutoffTime = 0;
  if (lastSyncDate) {
    cutoffTime = new Date(lastSyncDate).getTime();
  } else {
    // First time connecting: only sync problems solved in the last 24 hours
    cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
  }

  const newSubmissions = submissions.filter(s => {
    const subTime = parseInt(s.timestamp) * 1000;
    return subTime > cutoffTime;
  });

  if (newSubmissions.length === 0) {
    return { status: "CONNECTED", message: "All recent problems already synced." };
  }

  // Find which problems are already in our DB by slug
  const allSlugs = newSubmissions.map(s => s.titleSlug);
  const existingProblems = await prisma.problem.findMany({
    where: { slug: { in: allSlugs } },
    select: { id: true, slug: true, approaches: { select: { id: true } } }
  });
  
  const existingProblemMap = new Map();
  existingProblems.forEach(p => existingProblemMap.set(p.slug, p));

  // Process oldest-first (reverse chronological → chronological)
  newSubmissions.reverse();

  console.log(`[LeetCode Sync] Found ${newSubmissions.length} new problem(s) to process.`);

  const syncedProblems = [];
  const errors = [];

  for (const submission of newSubmissions) {
    try {
      console.log(`[LeetCode Sync] Processing: "${submission.title}" (${submission.titleSlug})...`);

      // 4a. Fetch the submission code from LeetCode
      const submissionDetails = await fetchSubmissionDetails(leetcodeSession, submission.id);

      if (!submissionDetails || !submissionDetails.code) {
        console.warn(`[LeetCode Sync] ⚠️ Could not fetch code for "${submission.title}", skipping.`);
        errors.push({ title: submission.title, error: "Could not fetch code" });
        continue;
      }

      const existingProblem = existingProblemMap.get(submission.titleSlug);

      if (existingProblem) {
        // PROBLEM ALREADY EXISTS - Append as a new approach
        console.log(`[LeetCode Sync] 🔄 Problem exists. Appending new approach for "${submission.title}"...`);
        
        const solveDate = new Date(parseInt(submission.timestamp) * 1000).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        // Save new approach
        await prisma.problemApproach.create({
          data: {
            problemId: existingProblem.id,
            title: `Solved on ${solveDate}`,
            cppCode: submissionDetails.code,
            timeComplexity: "", // Leave blank, user can edit or we can run Gemini if desired
            spaceComplexity: "",
            approachNotes: `Automatically synced from LeetCode submission on ${solveDate}.`,
            visualHtml: "",
            order: existingProblem.approaches?.length || 0
          }
        });
        
        syncedProblems.push({ title: submission.title, status: "UPDATED" });
        
      } else {
        // NEW PROBLEM - Run Gemini and create new entry
        console.log(`[LeetCode Sync] ✨ New problem. Analyzing with Gemini...`);
        const analysis = await analyzeProblemWithGemini({
          title: submission.title,
          code: submissionDetails.code
        });

        const problem = await saveProblemToDB(submission, submissionDetails, analysis);
        syncedProblems.push(problem);
        console.log(`[LeetCode Sync] ✅ Created: "${submission.title}"`);
      }

      // Small delay to respect rate limits
      if (newSubmissions.indexOf(submission) < newSubmissions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`[LeetCode Sync] ❌ Failed to sync "${submission.title}":`, error.message);
      errors.push({ title: submission.title, error: error.message });
      continue;
    }
  }

  // 5. Build result message
  const totalSynced = syncedProblems.length;
  const totalFailed = errors.length;

  let message = `Synced ${totalSynced} new problem(s).`;
  if (totalFailed > 0) {
    message += ` ${totalFailed} problem(s) failed (will retry next sync).`;
  }

  return {
    status: "CONNECTED",
    message,
    problem: syncedProblems[syncedProblems.length - 1] || null, // Return latest synced for UI
    syncedCount: totalSynced,
    failedCount: totalFailed,
    errors: errors.length > 0 ? errors : undefined
  };
}
