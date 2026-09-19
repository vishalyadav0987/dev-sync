import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    const blogs = await prisma.blog.findMany({ include: { author: true } });
    console.log(`Total blogs: ${blogs.length}`);
    blogs.forEach(b => {
        console.log(`- ${b.title} (by ${b.author.displayName} | ID: ${b.author.id})`);
    });
    await prisma.$disconnect();
}
run();
