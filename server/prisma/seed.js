import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const arrays = await prisma.category.create({ data: { name: "Arrays", slug: "arrays", order: 1 } });
  const dp = await prisma.category.create({ data: { name: "Dynamic Programming", slug: "dp", order: 2 } });
  await prisma.category.create({ data: { name: "1D DP", slug: "dp-1d", parentId: dp.id, order: 1 } });
  const bs = await prisma.category.create({ data: { name: "Binary Search", slug: "binary-search", order: 3 } });

  await prisma.problem.create({
    data: {
      title: "Two Sum",
      slug: "two-sum",
      statement: "Given an array of integers and a target, return indices of the two numbers that add up to target.",
      difficulty: "EASY",
      tags: ["hash-map", "array"],
      cppCode: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen; // value -> index
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.count(complement)) return {seen[complement], i};
        seen[nums[i]] = i;
    }
    return {};
}`,
      timeComplexity: "O(n)",
      spaceComplexity: "O(n)",
      edgeCases: ["Empty array", "No valid pair exists", "Duplicate values summing to target"],
      approachNotes:
        "Single pass hash map: for each element, check if its complement was already seen.",
      categoryId: arrays.id,
    },
  });

  console.log("Seeded categories + sample problem.");
}

main().finally(() => prisma.$disconnect());
