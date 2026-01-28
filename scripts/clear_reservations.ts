
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Deleting all notification logs...");
    await prisma.notificationLog.deleteMany({});

    console.log("Deleting all reservations...");
    await prisma.reservation.deleteMany({});

    console.log("Done. Database cleared of reservations.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
