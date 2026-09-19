import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.problemApproach.deleteMany({
    where: {
      title: { startsWith: "Solved on" },
      problem: {
        title: { in: ["Sudoku Solver", "Valid Sudoku"] }
      }
    }
  });
  console.log("Deleted:", res.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
