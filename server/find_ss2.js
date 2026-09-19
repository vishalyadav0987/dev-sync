import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const problems = await prisma.problem.findMany({
    select: { title: true, slug: true }
  });
  console.log(problems.map(p => p.title).join(", "));
}
main().catch(console.error).finally(() => prisma.$disconnect());
