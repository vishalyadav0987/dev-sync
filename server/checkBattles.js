import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    const users = await prisma.guestSession.findMany({ include: { _count: { select: { wonBattles: true } } } });
    console.log("Users:", users.map(u => ({ name: u.displayName, wins: u._count.wonBattles })));
    
    const battles = await prisma.battleResult.findMany();
    console.log("Battles:", battles);
    
    await prisma.$disconnect();
}
run();
