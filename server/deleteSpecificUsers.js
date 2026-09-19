import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    const idsToDelete = [
        "123e4567-e89b-12d3-a456-426614174000",
        "12345678-1234-1234-1234-123456789012",
        "ffffffff-ffff-ffff-ffff-ffffffffffff",
        "27779d80-ea9d-4d90-a1e6-ef2afcb9f0d7",
        "89c1ac0e-bcac-4d9e-966a-49f92e3d2856",
        "16aacbab-7eae-4c51-b3d3-183b53dbb201"
    ];
    try {
        const deleted = await prisma.guestSession.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        });
        console.log(`Successfully deleted ${deleted.count} user records.`);
    } catch (e) {
        console.error("Error deleting users:", e);
    }
    await prisma.$disconnect();
}
run();
