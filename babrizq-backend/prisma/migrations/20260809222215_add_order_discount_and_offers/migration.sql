-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Offer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("discountType", "discountValue", "id", "productId", "status", "storeId", "titleAr", "titleEn", "validFrom", "validTo") SELECT "discountType", "discountValue", "id", "productId", "status", "storeId", "titleAr", "titleEn", "validFrom", "validTo" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE INDEX "Offer_storeId_idx" ON "Offer"("storeId");
CREATE INDEX "Offer_status_idx" ON "Offer"("status");
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerUserId" TEXT,
    "storeId" TEXT NOT NULL,
    "assignedDriverId" TEXT,
    "orderNumber" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "customerNameEn" TEXT NOT NULL,
    "customerNameAr" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "addressEn" TEXT NOT NULL,
    "addressAr" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "deliveryFee" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "offerId" TEXT,
    "proofOfDeliveryUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("addressAr", "addressEn", "assignedDriverId", "createdAt", "currency", "customerNameAr", "customerNameEn", "customerPhone", "customerUserId", "deliveryFee", "id", "lat", "lng", "notes", "orderDate", "orderNumber", "paymentMethod", "proofOfDeliveryUrl", "status", "storeId", "subtotal", "tax", "total", "updatedAt") SELECT "addressAr", "addressEn", "assignedDriverId", "createdAt", "currency", "customerNameAr", "customerNameEn", "customerPhone", "customerUserId", "deliveryFee", "id", "lat", "lng", "notes", "orderDate", "orderNumber", "paymentMethod", "proofOfDeliveryUrl", "status", "storeId", "subtotal", "tax", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");
CREATE INDEX "Order_offerId_idx" ON "Order"("offerId");
CREATE INDEX "Order_customerUserId_idx" ON "Order"("customerUserId");
CREATE INDEX "Order_assignedDriverId_idx" ON "Order"("assignedDriverId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_orderDate_idx" ON "Order"("orderDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
