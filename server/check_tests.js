import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.problem.findFirst({ where: { testCases: { not: null } } });
  console.log(p ? p.testCases : "No test cases found in DB");
}
main().catch(console.error).finally(() => prisma.$disconnect());
