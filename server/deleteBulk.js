import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
    { name: "Arrays", slug: "arrays" },
    { name: "Strings", slug: "strings" },
    { name: "Linked List", slug: "linked-list" },
    { name: "Stacks & Queues", slug: "stacks-queues" },
    { name: "Trees", slug: "trees" },
    { name: "Graphs", slug: "graphs" },
    { name: "Dynamic Programming", slug: "dp" },
    { name: "Backtracking", slug: "backtracking" },
    { name: "Binary Search", slug: "binary-search" },
    { name: "Greedy", slug: "greedy" },
    { name: "Heaps", slug: "heaps" },
];

async function run() {
    try {
        console.log("Fetching problems to delete...");
        
        // Deleting all SessionProblems first, to prevent foreign key errors
        await prisma.sessionProblem.deleteMany({});
        await prisma.mistakeReview.deleteMany({});
        await prisma.battleResult.deleteMany({});
        await prisma.note.deleteMany({});
        
        const deleteRes = await prisma.problem.deleteMany({});
        console.log(`Deleted ${deleteRes.count} problems.`);
        
        const catRes = await prisma.category.deleteMany({
            where: {
                slug: {
                    in: CATEGORIES.map(c => c.slug)
                }
            }
        });
        console.log(`Deleted ${catRes.count} categories.`);
        
    } catch (e) {
        console.error("Error deleting:", e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
