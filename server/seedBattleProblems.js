import { PrismaClient } from "./src/generated/battle-client/index.js";

const battlePrisma = new PrismaClient();

const sampleProblems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "EASY",
    statement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    constraints: "- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.",
    inputFormat: "An array of integers `nums` and an integer `target`.",
    outputFormat: "An array of two integers representing the indices.",
    functionName: "twoSum",
    returnType: "vector<int>",
    paramTypes: ["vector<int>", "int"],
    paramNames: ["nums", "target"],
    // Two Sum's answer can be returned in either order ([0,1] or [1,0]) —
    // without this, a correct solution that happens to return indices in
    // the "other" order is wrongly marked WRONG_ANSWER.
    comparisonMode: "unordered",
    starterCode: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
    language: "cpp",
    tags: ["Array", "Hash Table"],
    category: "Array",
    testCases: [
      // Public Tests (2)
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1], isPublic: true },
      { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2], isPublic: true },
      // Hidden Tests (10)
      { input: { nums: [3, 3], target: 6 }, expected: [0, 1], isPublic: false },
      { input: { nums: [2, 1, 5, 3], target: 4 }, expected: [1, 3], isPublic: false },
      { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expected: [2, 4], isPublic: false },
      { input: { nums: [0, 4, 3, 0], target: 0 }, expected: [0, 3], isPublic: false },
      { input: { nums: [1000000000, 1000000000, 2000000000], target: 3000000000 }, expected: [0, 2], isPublic: false },
      { input: { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target: 19 }, expected: [8, 9], isPublic: false },
      { input: { nums: [15, 10, 5, 0, -5], target: 10 }, expected: [0, 4], isPublic: false },
      { input: { nums: [1, 5, 3, 7, 9, 11], target: 12 }, expected: [1, 3], isPublic: false },
      { input: { nums: [10, 20, 30, 40, 50, 60], target: 110 }, expected: [4, 5], isPublic: false },
      { input: { nums: [-10, 7, 19, 15], target: 9 }, expected: [0, 2], isPublic: false }
    ]
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "EASY",
    statement: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    constraints: "- 1 <= s.length <= 10^4\n- `s` consists of parentheses only '()[]{}'.",
    inputFormat: "A string `s`.",
    outputFormat: "A boolean `true` if valid, otherwise `false`.",
    functionName: "isValid",
    returnType: "bool",
    paramTypes: ["string"],
    paramNames: ["s"],
    starterCode: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
    language: "cpp",
    tags: ["String", "Stack"],
    category: "Stack",
    testCases: [
      // Public Tests (2)
      { input: { s: "()" }, expected: true, isPublic: true },
      { input: { s: "()[]{}" }, expected: true, isPublic: true },
      // Hidden Tests (10)
      { input: { s: "(]" }, expected: false, isPublic: false },
      { input: { s: "([)]" }, expected: false, isPublic: false },
      { input: { s: "{[]}" }, expected: true, isPublic: false },
      { input: { s: "" }, expected: true, isPublic: false },
      { input: { s: "[" }, expected: false, isPublic: false },
      { input: { s: "]" }, expected: false, isPublic: false },
      { input: { s: "(((())))" }, expected: true, isPublic: false },
      { input: { s: "((((((((" }, expected: false, isPublic: false },
      { input: { s: "))))))))" }, expected: false, isPublic: false },
      { input: { s: "{[()]}{[()]}" }, expected: true, isPublic: false }
    ]
  },
  {
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "MEDIUM",
    statement: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
    constraints: "- 1 <= nums.length <= 10^5\n- -10^4 <= nums[i] <= 10^4",
    inputFormat: "An integer array `nums`.",
    outputFormat: "An integer representing the maximum subarray sum.",
    functionName: "maxSubArray",
    returnType: "int",
    paramTypes: ["vector<int>"],
    paramNames: ["nums"],
    starterCode: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
    language: "cpp",
    tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
    category: "Array",
    testCases: [
      // Public Tests (2)
      { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expected: 6, isPublic: true },
      { input: { nums: [1] }, expected: 1, isPublic: true },
      // Hidden Tests (10)
      { input: { nums: [5, 4, -1, 7, 8] }, expected: 23, isPublic: false },
      { input: { nums: [-1] }, expected: -1, isPublic: false },
      { input: { nums: [-2, -1] }, expected: -1, isPublic: false },
      { input: { nums: [8, -19, 5, -4, 20] }, expected: 21, isPublic: false },
      { input: { nums: [2, 1, -3, 4, -1, 2, 1, -5, 4] }, expected: 6, isPublic: false },
      { input: { nums: [0] }, expected: 0, isPublic: false },
      { input: { nums: [-10000] }, expected: -10000, isPublic: false },
      { input: { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, expected: 45, isPublic: false },
      { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4, 10] }, expected: 15, isPublic: false },
      { input: { nums: [100, -10, -10, 100] }, expected: 180, isPublic: false }
    ]
  }
];

async function seed() {
  console.log("Seeding battle problems...");

  for (const p of sampleProblems) {
    const existing = await battlePrisma.battleProblem.findUnique({
      where: { slug: p.slug }
    });

    const { testCases, ...problemData } = p;

    if (existing) {
      // Re-run this script to pick up metadata fixes (e.g. comparisonMode)
      // on problems that were already seeded — a plain "skip if exists"
      // meant a bug fix here silently never reached an already-seeded DB.
      // Test cases are left alone (existing submissions/results reference
      // them by id).
      await battlePrisma.battleProblem.update({
        where: { slug: p.slug },
        data: problemData
      });
      console.log(`Updated metadata for ${p.title} (already existed).`);
      continue;
    }

    await battlePrisma.battleProblem.create({
      data: {
        ...problemData,
        testCases: {
          create: testCases.map((tc, index) => ({
            ...tc,
            order: index
          }))
        }
      }
    });

    console.log(`Seeded ${p.title} with ${testCases.length} test cases.`);
  }

  console.log("Seeding complete.");
}

seed()
  .catch(e => console.error(e))
  .finally(() => battlePrisma.$disconnect());
