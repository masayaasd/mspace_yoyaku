/*
  Warnings:

  - Added the required column `partySize` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "lineUserId" TEXT,
    "partySize" INTEGER NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "PokerTable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "customerName", "customerPhone", "endTime", "id", "lineUserId", "notes", "startTime", "status", "tableId", "updatedAt") SELECT "createdAt", "customerName", "customerPhone", "endTime", "id", "lineUserId", "notes", "startTime", "status", "tableId", "updatedAt" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_tableId_startTime_endTime_idx" ON "Reservation"("tableId", "startTime", "endTime");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
