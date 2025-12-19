import { z } from 'zod';

export const WebhookSchema = z.object({
  body_included: z.boolean().optional(),
  event_id: z.string(),
  event_type: z.string(),  // "message.received"
  message: z.object({
    created_at: z.string().optional(),
    extracted_html: z.string().optional(),
    extracted_text: z.string().optional(),
    from: z.string().optional(),
    from_: z.string(),  // Changed to string based on payload (not array)
    headers: z.object({}).optional(),  // Empty object or expand if needed
    html: z.string().optional(),
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
    timestamp: z.string().optional(),
    to: z.array(z.string()).optional(),
    updated_at: z.string().optional(),
    attachments: z.array(z.object({
      attachment_id: z.string(),
      filename: z.string(),
      content_type: z.string(),
      size: z.number(),
      inline: z.boolean()
    })).optional()
    // Add more message fields as needed; made optional for flexibility
  }),
  thread: z.object({
    created_at: z.string().optional(),
    inbox_id: z.string().optional(),
    labels: z.array(z.string()).optional(),
    last_message_id: z.string().optional(),
    message_count: z.number().optional(),
    organization_id: z.string().optional(),
    pod_id: z.string().optional(),
    preview: z.string().optional(),
    received_timestamp: z.string().optional(),
    recipients: z.array(z.string()).optional(),
    senders: z.array(z.string()).optional(),
    size: z.number().optional(),
    subject: z.string().optional(),
    thread_id: z.string().optional(),
    timestamp: z.string().optional(),
    updated_at: z.string().optional()
  }).optional(),
  type: z.string().optional()
});  // Removed .strict() to allow unrecognized keys; added root keys like body_included, thread, type

export type WebhookDto = z.infer<typeof WebhookSchema>;