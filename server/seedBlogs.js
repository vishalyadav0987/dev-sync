import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

const sampleBlogs = [
  {
    title: "Mastering Dynamic Programming in 2026",
    contentMd: "Dynamic programming is a method for solving complex problems by breaking them down into simpler subproblems. It is applicable to problems exhibiting the properties of overlapping subproblems and optimal substructure.\n\n## Top-Down vs Bottom-Up\n\nThere are two main ways to approach DP:\n\n1. **Top-Down (Memoization):** Write a recursive function and cache the results.\n2. **Bottom-Up (Tabulation):** Build an array from the ground up.\n\nHere is a simple Fibonacci example in C++:\n\n```cpp\nint fib(int n) {\n  if(n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}\n```",
    published: true,
  },
  {
    title: "Why you should learn Graph Theory for Competitive Programming",
    contentMd: "Graph theory is an essential part of competitive programming. Understanding BFS, DFS, Dijkstra's, and Kruskal's algorithm will give you a significant edge in solving hard problems.\n\nMany problems that don't look like graph problems can actually be modeled as graphs. For instance, finding the shortest sequence of transformations between two words can be solved using BFS on an implicit graph.\n\nKeep practicing and building your intuition!",
    published: true,
  },
  {
    title: "The Ultimate Guide to Sliding Window Technique",
    contentMd: "The sliding window technique is used to perform operations on a specific window size of a given array or string. It reduces the time complexity from O(n^2) to O(n) in many cases.\n\n### When to use it?\n- When you need to find a contiguous subarray or substring.\n- When the problem asks for the max/min/longest/shortest something in an array.\n\nHope this helps!",
    published: true,
  }
];

async function seed() {
  console.log("Seeding blogs...");
  
  // Create a dummy user for the blogs
  const author = await prisma.guestSession.create({
    data: {
      displayName: "Algorithm Master",
    }
  });

  for (const b of sampleBlogs) {
    const slug = slugify(b.title, { lower: true, strict: true }) + "-" + Date.now().toString(36);
    await prisma.blog.create({
      data: {
        title: b.title,
        slug,
        contentMd: b.contentMd,
        published: b.published,
        authorId: author.id
      }
    });
  }

  console.log("Seeding complete.");
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
