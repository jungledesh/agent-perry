/*
  Warnings:

  - You are about to drop the `Lead` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Lead";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_name" TEXT,
    "customer_number" TEXT NOT NULL DEFAULT 'pending-extraction',
    "customer_address" TEXT,
    "provider" TEXT NOT NULL,
    "provider_lead_id" TEXT,
    "org_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "lead_raw_data" JSONB NOT NULL,
    "chat_channel" TEXT DEFAULT 'email',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
