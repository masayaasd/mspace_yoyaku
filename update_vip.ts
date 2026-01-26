
import { prisma } from "./src/lib/prisma";

async function main() {
    await prisma.pokerTable.update({
        where: { name: "VIP" },
        data: { capacityMax: 5 }
    });
    console.log("Updated VIP capacityMax to 5");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
