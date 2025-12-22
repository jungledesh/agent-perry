-- AlterTable
ALTER TABLE "Leads" ADD COLUMN "lead_metadata" JSONB;
ALTER TABLE "Leads" ADD COLUMN "workflow_id" TEXT;
