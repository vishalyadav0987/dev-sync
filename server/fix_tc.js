const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.battleProblem.findFirst({ where: { slug: 'two-sum' }, include: { testCases: true } });
  if (p) {
    const tcToUpdate = p.testCases.find(tc => JSON.stringify(tc.input).includes('3000000000'));
    if (tcToUpdate) {
      await prisma.battleTestCase.update({
        where: { id: tcToUpdate.id },
        data: { input: { nums: [1000000000, 500000000, 1000000000], target: 2000000000 } }
      });
      console.log('Fixed TC 6');
    }
  }
}
main().finally(() => prisma.$disconnect());
