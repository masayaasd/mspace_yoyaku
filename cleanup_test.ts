
import { prisma } from "./src/lib/prisma";

async function cleanup() {
    const tables = await prisma.pokerTable.findMany({
        where: { name: { startsWith: "TestTable_Overlap" } }
    });

    for (const t of tables) {
        await prisma.reservation.deleteMany({ where: { tableId: t.id } });
        await prisma.pokerTable.delete({ where: { id: t.id } });
        console.log(`Deleted table: ${t.name}`);
    }
}

cleanup()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
