ALTER TABLE "repair_orders"
ADD COLUMN "folio" TEXT,
ADD COLUMN "folio_number" INTEGER;

WITH numbered_orders AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "company_id"
      ORDER BY "created_at" ASC, "id" ASC
    )::INTEGER AS "sequence_number"
  FROM "repair_orders"
)
UPDATE "repair_orders" AS ro
SET
  "folio_number" = numbered_orders."sequence_number",
  "folio" = CONCAT(
    'RP-',
    EXTRACT(YEAR FROM ro."created_at")::INTEGER,
    '-',
    LPAD(numbered_orders."sequence_number"::TEXT, 6, '0')
  )
FROM numbered_orders
WHERE ro."id" = numbered_orders."id";

ALTER TABLE "repair_orders"
ALTER COLUMN "folio" SET NOT NULL,
ALTER COLUMN "folio_number" SET NOT NULL;

CREATE INDEX "repair_orders_folio_idx" ON "repair_orders"("folio");

CREATE UNIQUE INDEX "repair_orders_company_id_folio_key"
ON "repair_orders"("company_id", "folio");

CREATE UNIQUE INDEX "repair_orders_company_id_folio_number_key"
ON "repair_orders"("company_id", "folio_number");
