import dotenv from 'dotenv';
import { AgentMailClient } from 'agentmail';

// Load environment variables from .env file
dotenv.config();

async function main() {
  const {
    AGENTMAIL_API_KEY,
    AGENTMAIL_INBOX_ID,
    AGENTMAIL_INBOX_DISPLAY_NAME,
    AGENTMAIL_WEBHOOK_URL,
  } = process.env;

  if (!AGENTMAIL_API_KEY) {
    throw new Error('AGENTMAIL_API_KEY is not set');
  }

  if (!AGENTMAIL_WEBHOOK_URL) {
    throw new Error('AGENTMAIL_WEBHOOK_URL is not set');
  }

  if (!AGENTMAIL_INBOX_ID && !AGENTMAIL_INBOX_DISPLAY_NAME) {
    throw new Error(
      'Either AGENTMAIL_INBOX_ID or AGENTMAIL_INBOX_DISPLAY_NAME must be set',
    );
  }

  const client = new AgentMailClient({ apiKey: AGENTMAIL_API_KEY });

  const { inboxes } = await client.inboxes.list();

  const leadInbox = inboxes.find(
    (i) =>
      i.inboxId === AGENTMAIL_INBOX_ID ||
      i.displayName === AGENTMAIL_INBOX_DISPLAY_NAME,
  );

  if (!leadInbox) {
    throw new Error('Specified inbox not found');
  }

  console.log('Lead Inbox found');

  // Check if webhook already exists for this inbox & URL
  const { webhooks } = await client.webhooks.list();
  const existingWebhook = webhooks.find(
    (w) =>
      w.url === AGENTMAIL_WEBHOOK_URL &&
      w.inboxIds?.includes(leadInbox.inboxId),
  );

  if (existingWebhook) {
    console.log('Webhook already exists for this inbox. Skipping creation.');
    if (process.env.DEBUG === 'true') {
      console.log('Debug refs', {
        inboxRef: leadInbox.inboxId,
        webhookRef: existingWebhook.webhookId,
      });
    }
    return; // idempotent exit
  }

  // Create webhook since none exists
  const webhook = await client.webhooks.create({
    url: AGENTMAIL_WEBHOOK_URL,
    eventTypes: ['message.received'],
    inboxIds: [leadInbox.inboxId],
  });

  console.log('Webhook registered successfully');

  if (process.env.DEBUG === 'true') {
    console.log('Debug refs', {
      inboxRef: leadInbox.inboxId,
      webhookRef: webhook.webhookId,
    });
  }
}

main().catch((err: unknown) => {
  if (err instanceof Error) {
    console.error('Setup failed:', err.message);
  } else {
    console.error('Setup failed with unknown error:', err);
  }

  process.exit(1);
});
