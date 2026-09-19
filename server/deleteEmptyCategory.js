import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    await prisma.category.delete({
        where: { slug: "linked-list" }
    });
    console.log("Deleted empty Linked List category.");
    await prisma.$disconnect();
}
run();
