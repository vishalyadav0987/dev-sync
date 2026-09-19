import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const idsToRemove = [
  "123e4567-e89b-12d3-a456-426614174000",
  "12345678-1234-1234-1234-123456789012",
  "ffffffff-ffff-ffff-ffff-ffffffffffff",
  "27779d80-ea9d-4d90-a1e6-ef2afcb9f0d7",
  "89c1ac0e-bcac-4d9e-966a-49f92e3d2856",
  "16aacbab-7eae-4c51-b3d3-183b53dbb201"
];

async function run() {
  const results = await prisma.battleResult.findMany();
  for (const r of results) {
    if (r.players && Array.isArray(r.players)) {
      const filteredPlayers = r.players.filter(p => !idsToRemove.includes(p.uuid || p.participantId));
      if (filteredPlayers.length !== r.players.length) {
        await prisma.battleResult.update({
          where: { id: r.id },
          data: {
            players: filteredPlayers,
            winnerId: idsToRemove.includes(r.winnerId) ? null : r.winnerId
          }
        });
        console.log(`Updated BattleResult ${r.id}, removed ${r.players.length - filteredPlayers.length} players`);
      }
    }
  }
  
  // Also delete GuestSessions for these IDs so they are completely gone
  for (const id of idsToRemove) {
    try {
      await prisma.guestSession.delete({ where: { id } });
      console.log(`Deleted GuestSession ${id}`);
    } catch (e) {
      // ignore if not found
    }
  }
  console.log("Done");
}

run().catch(console.error).finally(() => prisma.$disconnect());
