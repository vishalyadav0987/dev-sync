import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const problems = await prisma.problem.findMany({
    where: {
      title: { contains: "Sudoku" }
    },
    include: { approaches: true }
  });
  
  problems.forEach(p => {
    console.log(`\nProblem: ${p.title} (slug: ${p.slug})`);
    console.log(`Main visualHtml length: ${p.visualHtml ? p.visualHtml.length : 0}`);
    p.approaches.forEach((a, i) => {
      console.log(`  Approach ${i}: ${a.title}`);
      console.log(`  visualHtml length: ${a.visualHtml ? a.visualHtml.length : 0}`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
