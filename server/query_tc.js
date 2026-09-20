const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.battleProblem.findFirst({ where: { slug: 'two-sum' }, include: { testCases: true } });
  if (p) {
    for (const tc of p.testCases) {
      console.log(\`TC \${tc.order} size: \${tc.input.length}\`);
    }
  }
}
main().finally(() => prisma.$disconnect());
