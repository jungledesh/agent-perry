import { WebhookSchema } from './webhook.dto';

describe('WebhookDto', () => {
  describe('WebhookSchema validation', () => {
    const validWebhook = {
      event_id: 'test-event-id',
      event_type: 'message.received',
      message: {
        message_id: 'test-message-id',
        subject: 'Test Subject',
        text: 'Test email body',
        from: 'test@example.com',
        from_: 'Test Sender <test@example.com>',
        to: ['recipient@example.com'],
        timestamp: new Date().toISOString(),
        inbox_id: 'test-inbox',
        organization_id: 'test-org',
      },
    };

    it('should validate a valid webhook payload', () => {
      const result = WebhookSchema.safeParse(validWebhook);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.event_id).toBe('test-event-id');
        expect(result.data.event_type).toBe('message.received');
      }
    });

    it('should require event_id', () => {
      const invalid = { ...validWebhook };
      delete (invalid as any).event_id;
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should require event_type', () => {
      const invalid = { ...validWebhook };
      delete (invalid as any).event_type;
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should only allow message.received as event_type', () => {
      const invalid = {
        ...validWebhook,
        event_type: 'invalid.type',
      };
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should require message object', () => {
      const invalid = { ...validWebhook };
      delete (invalid as any).message;
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should require message.subject', () => {
      const invalid = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          subject: undefined,
        },
      };
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should require message.text', () => {
      const invalid = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          text: undefined,
        },
      };
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should require message.from', () => {
      const invalid = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          from: undefined,
        },
      };
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should require message.from_', () => {
      const invalid = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          from_: undefined,
        },
      };
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should require message.inbox_id', () => {
      const invalid = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          inbox_id: undefined,
        },
      };
      const result = WebhookSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept optional extracted_text', () => {
      const withExtractedText = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          extracted_text: 'Extracted content',
        },
      };
      const result = WebhookSchema.safeParse(withExtractedText);
      expect(result.success).toBe(true);
    });

    it('should accept optional extracted_html', () => {
      const withExtractedHtml = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          extracted_html: '<html>content</html>',
        },
      };
      const result = WebhookSchema.safeParse(withExtractedHtml);
      expect(result.success).toBe(true);
    });

    it('should validate ISO timestamp in message.timestamp', () => {
      const withValidTimestamp = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          timestamp: new Date().toISOString(),
        },
      };
      const result = WebhookSchema.safeParse(withValidTimestamp);
      expect(result.success).toBe(true);
    });

    it('should reject invalid timestamp format', () => {
      const withInvalidTimestamp = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          timestamp: 'not-a-date',
        },
      };
      const result = WebhookSchema.safeParse(withInvalidTimestamp);
      expect(result.success).toBe(false);
    });

    it('should accept optional thread object', () => {
      const withThread = {
        ...validWebhook,
        thread: {
          thread_id: 'test-thread-id',
          subject: 'Thread Subject',
        },
      };
      const result = WebhookSchema.safeParse(withThread);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.thread?.thread_id).toBe('test-thread-id');
      }
    });

    it('should accept optional attachments array', () => {
      const withAttachments = {
        ...validWebhook,
        message: {
          ...validWebhook.message,
          attachments: [
            {
              attachment_id: 'att-1',
              filename: 'test.pdf',
              content_type: 'application/pdf',
              size: 1024,
              inline: false,
            },
          ],
        },
      };
      const result = WebhookSchema.safeParse(withAttachments);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message.attachments).toHaveLength(1);
      }
    });
  });
});
