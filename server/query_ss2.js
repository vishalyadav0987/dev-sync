import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.problem.findUnique({
    where: { slug: "subsets-ii" },
    include: { approaches: true }
  });
  console.log(`Main visualHtml: ${p.visualHtml ? p.visualHtml.substring(0, 100) : null}`);
  p.approaches.forEach(a => {
    console.log(`Approach: ${a.title}, visualHtml length: ${a.visualHtml ? a.visualHtml.length : 0}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
