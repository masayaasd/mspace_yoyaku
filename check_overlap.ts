
import { reservationService } from "./src/services/reservationService";
import { prisma } from "./src/lib/prisma";

async function testOverlap() {
    // 1. Create a table
    const table = await prisma.pokerTable.create({
        data: {
            name: `TestTable_Overlap_${Date.now()}`,
            category: "General",
            capacityMin: 2,
            capacityMax: 6,
            isSmoking: false,
            displayOrder: 99
        }
    });

    console.log("Created Table:", table.id);

    // 2. Create Reservation A: 10:00 - 12:00
    const startA = new Date();
    startA.setHours(10, 0, 0, 0);
    const endA = new Date(startA);
    endA.setHours(12, 0, 0, 0);

    const resA = await reservationService.createReservation({
        tableId: table.id,
        customerName: "Res A",
        customerPhone: "090-0000-0000",
        partySize: 4,
        startTime: startA,
        endTime: endA
    });
    console.log("Created Res A:", resA.id, "10:00-12:00");

    // 3. Try Create Reservation B: 11:00 - 13:00 (Overlap)
    const startB = new Date(startA);
    startB.setHours(11, 0, 0, 0);
    const endB = new Date(startA);
    endB.setHours(13, 0, 0, 0);

    try {
        await reservationService.createReservation({
            tableId: table.id,
            customerName: "Res B",
            customerPhone: "090-0000-0000",
            partySize: 4,
            startTime: startB,
            endTime: endB
        });
        console.error("FAIL: Res B created despite overlap!");
    } catch (e: any) {
        console.log("SUCCESS: Res B rejected:", e.message);
    }

    // 4. Try Create Reservation C: 12:00 - 14:00 (No Overlap)
    const startC = new Date(startA);
    startC.setHours(12, 0, 0, 0);
    const endC = new Date(startA);
    endC.setHours(14, 0, 0, 0);

    try {
        await reservationService.createReservation({
            tableId: table.id,
            customerName: "Res C",
            customerPhone: "090-0000-0000",
            partySize: 4,
            startTime: startC,
            endTime: endC
        });
        console.log("SUCCESS: Res C created (No overlap).");
    } catch (e: any) {
        console.error("FAIL: Res C rejected:", e.message);
    }

    // Cleanup
    await prisma.reservation.deleteMany({ where: { tableId: table.id } });
    await prisma.pokerTable.delete({ where: { id: table.id } });
}

testOverlap()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
