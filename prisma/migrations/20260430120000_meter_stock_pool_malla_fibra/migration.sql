-- Inventario por metros compartido (Malla Fibra: rollo 50 m + venta por metro).

CREATE TABLE "MeterStockPool" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "meters" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeterStockPool_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MeterStockPool_key_key" ON "MeterStockPool"("key");

ALTER TABLE "Product" ADD COLUMN "meterStockPoolId" INTEGER,
ADD COLUMN "meterConsumePerQty" INTEGER;

ALTER TABLE "Product" ADD CONSTRAINT "Product_meterStockPoolId_fkey" FOREIGN KEY ("meterStockPoolId") REFERENCES "MeterStockPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "MeterStockPool" ("key", "meters", "updatedAt")
VALUES (
    'MAL_FIBRA',
    COALESCE((SELECT CASE WHEN EXISTS (SELECT 1 FROM "Product" WHERE "sku" = 'MAL-001')
                          THEN GREATEST(0, (SELECT "stock" * 50 FROM "Product" WHERE "sku" = 'MAL-001' LIMIT 1))
                          ELSE 0 END),
             0),
    CURRENT_TIMESTAMP
);

UPDATE "Product"
SET "meterStockPoolId" = (SELECT "id" FROM "MeterStockPool" WHERE "key" = 'MAL_FIBRA' LIMIT 1),
    "meterConsumePerQty" = 50
WHERE "sku" = 'MAL-001';

UPDATE "Product"
SET "meterStockPoolId" = (SELECT "id" FROM "MeterStockPool" WHERE "key" = 'MAL_FIBRA' LIMIT 1),
    "meterConsumePerQty" = 1
WHERE "sku" = 'MAL-001-MT';

UPDATE "Product"
SET "stock" = (SELECT "meters" FROM "MeterStockPool" WHERE "key" = 'MAL_FIBRA' LIMIT 1)
WHERE "sku" IN ('MAL-001', 'MAL-001-MT');
