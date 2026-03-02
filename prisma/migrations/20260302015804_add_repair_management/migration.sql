-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('PENDING', 'DIAGNOSED', 'WAITING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('PARTS', 'TOOLS', 'SHIPPING', 'UTILITIES', 'SALARIES', 'RENT', 'MARKETING', 'OTHER');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_orders" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "device_model" TEXT NOT NULL,
    "issue_description" TEXT NOT NULL,
    "status" "RepairStatus" NOT NULL DEFAULT 'PENDING',
    "urgency_level" "UrgencyLevel" NOT NULL DEFAULT 'NORMAL',
    "cost_estimate" DECIMAL(10,2),
    "final_price" DECIMAL(10,2),
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "public_tracking_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "repair_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_order_images" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "file_key" TEXT NOT NULL,

    CONSTRAINT "repair_order_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_order_comments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "author_id" UUID,
    "message" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_order_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_order_status_history" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "previous_status" "RepairStatus",
    "new_status" "RepairStatus" NOT NULL,
    "changed_by" UUID,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_company_id_phone_idx" ON "customers"("company_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "repair_orders_public_tracking_token_key" ON "repair_orders"("public_tracking_token");

-- CreateIndex
CREATE INDEX "repair_orders_company_id_idx" ON "repair_orders"("company_id");

-- CreateIndex
CREATE INDEX "repair_orders_customer_id_idx" ON "repair_orders"("customer_id");

-- CreateIndex
CREATE INDEX "repair_orders_status_idx" ON "repair_orders"("status");

-- CreateIndex
CREATE INDEX "repair_orders_public_tracking_token_idx" ON "repair_orders"("public_tracking_token");

-- CreateIndex
CREATE INDEX "repair_orders_company_id_status_idx" ON "repair_orders"("company_id", "status");

-- CreateIndex
CREATE INDEX "repair_orders_company_id_created_at_idx" ON "repair_orders"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "repair_order_images_order_id_idx" ON "repair_order_images"("order_id");

-- CreateIndex
CREATE INDEX "repair_order_comments_order_id_idx" ON "repair_order_comments"("order_id");

-- CreateIndex
CREATE INDEX "repair_order_comments_order_id_internal_idx" ON "repair_order_comments"("order_id", "internal");

-- CreateIndex
CREATE INDEX "repair_order_status_history_order_id_idx" ON "repair_order_status_history"("order_id");

-- CreateIndex
CREATE INDEX "repair_order_status_history_order_id_timestamp_idx" ON "repair_order_status_history"("order_id", "timestamp");

-- CreateIndex
CREATE INDEX "expenses_company_id_idx" ON "expenses"("company_id");

-- CreateIndex
CREATE INDEX "expenses_company_id_category_idx" ON "expenses"("company_id", "category");

-- CreateIndex
CREATE INDEX "expenses_company_id_created_at_idx" ON "expenses"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_images" ADD CONSTRAINT "repair_order_images_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "repair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_comments" ADD CONSTRAINT "repair_order_comments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "repair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_comments" ADD CONSTRAINT "repair_order_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_order_status_history" ADD CONSTRAINT "repair_order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "repair_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
