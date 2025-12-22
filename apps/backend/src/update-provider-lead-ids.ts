/**
 * Script to update existing provider_lead_id values from 'pending-action' to 'not provided'
 * Run with: npx ts-node src/update-provider-lead-ids.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:../../../backend/dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    'Updating provider_lead_id from "pending-action" to "not provided"...',
  );

  const result = await prisma.leads.updateMany({
    where: {
      provider_lead_id: 'pending-action',
    },
    data: {
      provider_lead_id: 'not provided',
    },
  });

  console.log(`Updated ${result.count} records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
