-- CreateTable
CREATE TABLE "Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_name" TEXT,
    "customer_number" TEXT NOT NULL,
    "customer_address" TEXT,
    "provider" TEXT NOT NULL,
    "provider_lead_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "chat_channel" TEXT DEFAULT 'sms',
    "lead_raw_data" JSONB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_provider_lead_id_key" ON "Lead"("provider_lead_id");
