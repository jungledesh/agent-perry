import { z } from 'zod';

// Helper for ISO timestamps
const ISODateString = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid ISO timestamp',
});

export const WebhookSchema = z.object({
  body_included: z.boolean().optional(),
  event_id: z.string(),
  event_type: z.enum(['message.received']), // strictly allow only known types
  type: z.string().optional(),
  message: z.object({
    created_at: ISODateString.optional(),
    updated_at: ISODateString.optional(),
    timestamp: ISODateString.optional(),
    extracted_html: z.string().optional(),
    extracted_text: z.string().optional(),
    html: z.string().optional(),
    from: z.string(),
    from_: z.string(),
    headers: z.record(z.string(), z.unknown()).optional(),
    inbox_id: z.string(),
    labels: z.array(z.string()).optional(),
    message_id: z.string().optional(),
    organization_id: z.string().optional(),
    pod_id: z.string().optional(),
    preview: z.string().optional(),
    size: z.number().optional(),
    smtp_id: z.string().optional(),
    subject: z.string(),
    text: z.string(),
    thread_id: z.string().optional(),
    to: z.array(z.string()).optional(),
    attachments: z
      .array(
        z.object({
          attachment_id: z.string(),
          filename: z.string(),
          content_type: z.string(),
          size: z.number(),
          inline: z.boolean(),
        }),
      )
      .optional(),
  }),
  thread: z
    .object({
      created_at: ISODateString.optional(),
      updated_at: ISODateString.optional(),
      received_timestamp: ISODateString.optional(),
      inbox_id: z.string().optional(),
      labels: z.array(z.string()).optional(),
      last_message_id: z.string().optional(),
      message_count: z.number().optional(),
      organization_id: z.string().optional(),
      pod_id: z.string().optional(),
      preview: z.string().optional(),
      recipients: z.array(z.string()).optional(),
      senders: z.array(z.string()).optional(),
      size: z.number().optional(),
      subject: z.string().optional(),
      thread_id: z.string().optional(),
      timestamp: ISODateString.optional(),
    })
    .optional(),
});

export type WebhookDto = z.infer<typeof WebhookSchema>;
