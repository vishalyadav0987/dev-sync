import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const approaches = await prisma.problemApproach.deleteMany({
    where: {
      title: {
        startsWith: 'Attempt '
      }
    }
  });
  console.log('Deleted approaches:', approaches.count);
}

run().catch(console.error).finally(() => prisma.$disconnect());
