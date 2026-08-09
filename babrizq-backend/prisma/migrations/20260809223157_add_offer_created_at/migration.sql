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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("discountType", "discountValue", "id", "productId", "redemptionCount", "status", "storeId", "titleAr", "titleEn", "validFrom", "validTo") SELECT "discountType", "discountValue", "id", "productId", "redemptionCount", "status", "storeId", "titleAr", "titleEn", "validFrom", "validTo" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE INDEX "Offer_storeId_idx" ON "Offer"("storeId");
CREATE INDEX "Offer_status_idx" ON "Offer"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
