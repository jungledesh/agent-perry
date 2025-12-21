import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDto } from './webhook.dto';
import { Prisma } from '@prisma/client';
import type { Leads } from '@prisma/client';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private prisma: PrismaService) {} // Inject Prisma

  async processWebhook(payload: WebhookDto): Promise<Leads> {
    try {
      const { message } = payload;

      const provider = this.determineProvider(message.from_ ?? '');

      const leadData = {
        customer_name: null, // PII extraction can be added later
        customer_number: 'pending-extraction',
        customer_address: null,
        provider: provider,
        provider_lead_id: 'pending-action', // Use message_id or event_id as fallback
        org_id: message.organization_id ?? 'default',
        chat_channel: 'email',
        lead_raw_data: JSON.parse(
          JSON.stringify(payload),
        ) as unknown as Prisma.InputJsonValue, // Serialize to plain JSON object
        status: 'new',
      };

      const created: Leads = await this.prisma.leads.create({ data: leadData });
      this.logger.debug(`Stored lead with id: ${created.id}`);
      return created; // Return full created object (includes ID for Temporal)
    } catch (err) {
      this.logger.error('Failed to store lead', err);
      throw err; // Bubble up to controller for error handling
    }
  }

  private determineProvider(from: string): string {
    // Simple heuristic; expand based on known providers
    if (from.toLowerCase().includes('yelp')) return 'Yelp';
    if (from.toLowerCase().includes('angi')) return 'Angi';
    if (from.toLowerCase().includes('google')) return 'Google LSA';
    return 'Unknown';
  }
}
