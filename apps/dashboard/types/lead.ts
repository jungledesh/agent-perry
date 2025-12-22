/**
 * Lead type matching the Prisma schema
 */
export interface Lead {
  id: number;
  customer_name: string | null;
  customer_number: string;
  customer_address: string | null;
  provider: string;
  provider_lead_id: string | null;
  org_id: string;
  status: string;
  lead_raw_data: {
    event_id?: string;
    event_type?: string;
    message?: {
      message_id?: string;
      subject?: string;
      text?: string;
      extracted_text?: string;
      from?: string;
      from_?: string;
      to?: string;
      timestamp?: string;
      inbox_id?: string;
      organization_id?: string;
    };
    thread?: {
      thread_id?: string;
      subject?: string;
    };
  };
  chat_channel: string | null;
  service_requested: string | null;
  workflow_id: string | null;
  lead_metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

