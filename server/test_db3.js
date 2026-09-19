import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const problems = await prisma.problem.findMany();
  console.log("Total Problems in DB:", problems.length);
  
  const subs = await prisma.extensionSubmission.findMany({
    include: { guest: true }
  });
  console.log("Total Extension Submissions:", subs.length);
  if (subs.length > 0) {
    console.log("Sample submission problemSlug:", subs[0].problemSlug, subs[0].status);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
