import { z } from "zod";

export const LeadExtractSchema = z.object({
  customer_name: z.string().optional().nullable(),

  // Changed from required to optional/nullable
  customer_number: z.string().optional().nullable(),

  customer_address: z.string().optional().nullable(),
  service_requested: z.string().optional().nullable(),
  provider_lead_id: z.string().optional().nullable(),
  lead_metadata: z.record(z.string(), z.any()).optional().nullable(),
});
