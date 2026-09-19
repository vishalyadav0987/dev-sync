import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    const user = await prisma.guestSession.findFirst();
    if (!user) return console.log("No user found");
    
    // Check if we have problems
    const problem = await prisma.problem.findFirst();
    if (!problem) return console.log("No problems found");

    const battle = await prisma.battleResult.create({
        data: {
            roomId: "TEST_ROOM_" + Date.now(),
            status: "FINISHED",
            maxPlayers: 2,
            problems: { connect: { id: problem.id } },
            winnerId: user.id
        }
    });
    console.log("Created Battle:", battle);
    await prisma.$disconnect();
}
run();
