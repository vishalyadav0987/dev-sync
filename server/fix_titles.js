import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const approaches = await prisma.problemApproach.findMany({
    where: {
      title: {
        contains: 'Attempt'
      }
    }
  });
  
  let updated = 0;
  for (const approach of approaches) {
    if (approach.title.includes(' - Solved on ')) {
      const newTitle = approach.title.split(' - ')[1];
      await prisma.problemApproach.update({
        where: { id: approach.id },
        data: { title: newTitle }
      });
      updated++;
    }
  }
  console.log('Fixed approaches:', updated);
}

run().catch(console.error).finally(() => prisma.$disconnect());
