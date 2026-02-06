/*
  Warnings:

  - You are about to drop the column `serialNumber` on the `Item` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "inn" TEXT,
    "orderNumber" TEXT,
    "category" TEXT,
    "subCategory" TEXT,
    "price" DECIMAL NOT NULL DEFAULT 0,
    "quantity" DECIMAL NOT NULL DEFAULT 1,
    "unit" TEXT DEFAULT 'dona',
    "purchaseDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'working',
    "condition" TEXT,
    "building" TEXT,
    "location" TEXT,
    "department" TEXT,
    "image" TEXT,
    "images" TEXT,
    "contractPdf" TEXT,
    "inventoryType" TEXT NOT NULL DEFAULT 'warehouse',
    "initialQuantity" DECIMAL DEFAULT 1,
    "initialOwner" TEXT,
    "initialRole" TEXT,
    "initialEmployeeId" TEXT,
    "handoverImage" TEXT,
    "assignedUserId" INTEGER,
    "assignedDate" DATETIME,
    "lastCheckedAt" DATETIME,
    "assignedDocument" TEXT,
    "employeeReport" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("assignedDate", "assignedDocument", "assignedUserId", "building", "category", "condition", "contractPdf", "createdAt", "department", "employeeReport", "handoverImage", "id", "image", "images", "initialEmployeeId", "initialOwner", "initialQuantity", "initialRole", "inn", "inventoryType", "lastCheckedAt", "location", "model", "name", "orderNumber", "price", "purchaseDate", "quantity", "status", "subCategory", "unit", "updatedAt") SELECT "assignedDate", "assignedDocument", "assignedUserId", "building", "category", "condition", "contractPdf", "createdAt", "department", "employeeReport", "handoverImage", "id", "image", "images", "initialEmployeeId", "initialOwner", "initialQuantity", "initialRole", "inn", "inventoryType", "lastCheckedAt", "location", "model", "name", "orderNumber", "price", "purchaseDate", "quantity", "status", "subCategory", "unit", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_status_idx" ON "Item"("status");
CREATE INDEX "Item_category_idx" ON "Item"("category");
CREATE INDEX "Item_assignedUserId_idx" ON "Item"("assignedUserId");
CREATE INDEX "Item_createdAt_idx" ON "Item"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
