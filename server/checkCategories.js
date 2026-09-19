import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    const cats = await prisma.category.findMany({ include: { _count: { select: { problems: true } } } });
    console.log(JSON.stringify(cats, null, 2));
    await prisma.$disconnect();
}
run();
