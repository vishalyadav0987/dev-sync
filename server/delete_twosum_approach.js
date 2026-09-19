import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const problem = await prisma.problem.findUnique({
    where: { slug: 'two-sum' }
  });
  if (!problem) {
    console.log("Two Sum not found");
    return;
  }
  
  const result = await prisma.problemApproach.deleteMany({
    where: {
      problemId: problem.id,
      title: { startsWith: 'Solved on' }
    }
  });
  console.log("Deleted approaches:", result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
