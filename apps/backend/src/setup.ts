import { config } from 'dotenv';
import { AgentMailClient } from 'agentmail';

// Load environment variables from .env file
config();

(async () => {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  if (!apiKey) {
    throw new Error('AGENTMAIL_API_KEY is not set in .env file');
  }

  const client = new AgentMailClient({ apiKey });

  // Find the specific inbox to filter webhooks
  const inboxesResponse = await client.inboxes.list();
  const leadInbox = inboxesResponse.inboxes.find(
    (i) => i.inboxId === 'perry@agentmail.to' || i.displayName === 'Lead Agent'
  );

  if (!leadInbox) {
    throw new Error(
      'Inbox with ID "perry@agentmail.to" or display name "Lead Agent" not found'
    );
  }

  console.log('Lead Inbox found:', {
    inboxId: leadInbox.inboxId,
    displayName: leadInbox.displayName,
  });

  // Register webhook - only for messages received on this specific inbox
  const webhookUrl = 'https://c48b34d96d00.ngrok-free.app/webhooks'; // Full endpoint path
  const webhook = await client.webhooks.create({
    url: webhookUrl,
    eventTypes: ['message.received'],
    inboxIds: [leadInbox.inboxId], // Filter to only this inbox
  });
  console.log('Webhook:', webhook);
})();