const fs = require('fs');
let code = fs.readFileSync('src/routes/extensionAuth.js', 'utf8');

// Replace the existingProblem check block
const oldExistingBlock = `      if (existingProblem) {
        console.log(\`[Extension] 🔄 Problem exists. Appending new approach for "\${problemTitle}"...\`);
        const solveDate = new Date().toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        });

        await prisma.problemApproach.create({
          data: {
            problemId: existingProblem.id,
            title: \`Solved on \${solveDate}\`,
            cppCode: code || "",
            timeComplexity: "",
            spaceComplexity: "",
            approachNotes: \`Automatically synced from LeetCode extension.\`,
            visualHtml: "",
            order: existingProblem.approaches.length
          }
        });

        await prisma.extensionSubmission.updateMany({
          where: { id: submission.id },
          data: { status: "PROCESSED" }
        });

        await updateStreakAndActivity(guest.id, 0, true);

      } else {`;

const newExistingBlock = `      if (existingProblem) {
        // Did THIS USER already solve it?
        const progress = await prisma.userProblemProgress.findUnique({
          where: {
            guestId_problemId: {
              guestId: guest.id,
              problemId: existingProblem.id
            }
          }
        });

        if (progress) {
          console.log(\`[Extension] ℹ️ Problem "\${problemTitle}" already solved by this user. Ignoring new submission.\`);
          await prisma.extensionSubmission.update({
            where: { id: submission.id },
            data: { 
              status: "PROCESSED",
              problemId: existingProblem.id 
            }
          });
          return res.json({ success: true, message: "ALREADY_SOLVED" });
        }

        console.log(\`[Extension] 🔄 Problem exists. Appending new approach for "\${problemTitle}"...\`);
        const solveDate = new Date().toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        });

        await prisma.problemApproach.create({
          data: {
            problemId: existingProblem.id,
            title: \`Solved on \${solveDate}\`,
            cppCode: code || "",
            timeComplexity: "",
            spaceComplexity: "",
            approachNotes: \`Automatically synced from LeetCode extension.\`,
            visualHtml: "",
            order: existingProblem.approaches.length
          }
        });

        await prisma.userProblemProgress.create({
          data: {
            guestId: guest.id,
            problemId: existingProblem.id,
            status: "SOLVED",
            firstAcceptedSubmissionId: String(submissionId)
          }
        });

        await prisma.extensionSubmission.updateMany({
          where: { id: submission.id },
          data: { 
            status: "PROCESSED",
            problemId: existingProblem.id 
          }
        });

        await updateStreakAndActivity(guest.id, 0, true);

      } else {`;

code = code.replace(oldExistingBlock, newExistingBlock);

// Inside else block, we need to save UserProblemProgress and set problemId on submission
const oldTryCatch = `        try {
          await prisma.problem.create({
            data: {
              title: problemTitle,
              slug: problemSlug,
              difficulty: "MEDIUM",
              cppCode: code || "",
              language: language,
              edgeCases: analysis.edgeCases || [],
              approachNotes: analysis.approachNotes || "",
              timeComplexity: analysis.timeComplexity || "",
              spaceComplexity: analysis.spaceComplexity || "",
              tags: analysis.tags || [],
              statement: analysis.statement || "",
              visualHtml: analysis.visualHtml || null,
              categoryId: category.id,
              leetcodeUrl: \`https://leetcode.com/problems/\${problemSlug}\`,
            }
          });
        } catch (dbError) {`;

const newTryCatch = `        let createdProblem;
        try {
          createdProblem = await prisma.problem.create({
            data: {
              title: problemTitle,
              slug: problemSlug,
              difficulty: "MEDIUM",
              cppCode: code || "",
              language: language,
              edgeCases: analysis.edgeCases || [],
              approachNotes: analysis.approachNotes || "",
              timeComplexity: analysis.timeComplexity || "",
              spaceComplexity: analysis.spaceComplexity || "",
              tags: analysis.tags || [],
              statement: analysis.statement || "",
              visualHtml: analysis.visualHtml || null,
              categoryId: category.id,
              leetcodeUrl: \`https://leetcode.com/problems/\${problemSlug}\`,
            }
          });
        } catch (dbError) {`;

code = code.replace(oldTryCatch, newTryCatch);

const oldElseCatch = `            if (existingProblem) {
              const oldCode = existingProblem.cppCode || "";
              const newCode = oldCode + \`\\n\\n// --- Another Approach (\${language}) ---\\n\\n\` + (code || "");

              await prisma.problem.update({
                where: { slug: problemSlug },
                data: {
                  cppCode: newCode,
                }
              });
            }
          } else {
            throw dbError; // rethrow if it's not a P2002 duplicate
          }
        }

        await prisma.extensionSubmission.updateMany({
          where: { id: submission.id },
          data: { status: "PROCESSED" }
        });

        await updateStreakAndActivity(guest.id, 0, true);`;

const newElseCatch = `            if (existingProblem) {
              createdProblem = existingProblem; // use the concurrently created one
              const oldCode = existingProblem.cppCode || "";
              const newCode = oldCode + \`\\n\\n// --- Another Approach (\${language}) ---\\n\\n\` + (code || "");

              await prisma.problem.update({
                where: { slug: problemSlug },
                data: {
                  cppCode: newCode,
                }
              });
            }
          } else {
            throw dbError; // rethrow if it's not a P2002 duplicate
          }
        }

        if (createdProblem) {
          // It's possible another worker already created UserProblemProgress too, so we use upsert or ignore
          await prisma.userProblemProgress.upsert({
            where: {
              guestId_problemId: {
                guestId: guest.id,
                problemId: createdProblem.id
              }
            },
            update: {},
            create: {
              guestId: guest.id,
              problemId: createdProblem.id,
              status: "SOLVED",
              firstAcceptedSubmissionId: String(submissionId)
            }
          });
          
          await prisma.extensionSubmission.updateMany({
            where: { id: submission.id },
            data: { 
              status: "PROCESSED",
              problemId: createdProblem.id 
            }
          });
        } else {
          await prisma.extensionSubmission.updateMany({
            where: { id: submission.id },
            data: { status: "PROCESSED" }
          });
        }

        await updateStreakAndActivity(guest.id, 0, true);`;

code = code.replace(oldElseCatch, newElseCatch);

fs.writeFileSync('src/routes/extensionAuth.js', code);
