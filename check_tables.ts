
import { prisma } from "./src/lib/prisma";

async function main() {
    const tables = await prisma.pokerTable.findMany();
    console.log("Tables:", JSON.stringify(tables, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
