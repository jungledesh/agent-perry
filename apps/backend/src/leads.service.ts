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

      // Store only essential fields for debugging/reprocessing (exclude large HTML)
      const essentialRawData = {
        event_id: payload.event_id,
        event_type: payload.event_type,
        message: {
          message_id: message.message_id,
          subject: message.subject,
          text: message.text || message.extracted_text, // Store only one text version
          from: message.from,
          from_: message.from_,
          to: message.to,
          timestamp: message.timestamp,
          inbox_id: message.inbox_id,
          organization_id: message.organization_id,
          // Exclude: html, extracted_html (too large), headers (usually not needed)
        },
        thread: payload.thread
          ? {
              thread_id: payload.thread.thread_id,
              subject: payload.thread.subject,
            }
          : undefined,
      };

      const leadData = {
        customer_name: null,
        customer_number: 'pending-extraction',
        customer_address: null,
        provider: provider,
        provider_lead_id:
          message.message_id || payload.event_id || 'pending-action',
        org_id: message.organization_id ?? 'default',
        chat_channel: 'email',
        lead_raw_data: essentialRawData as unknown as Prisma.InputJsonValue,
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

  async updateWorkflowId(leadId: number, workflowId: string): Promise<void> {
    try {
      await this.prisma.leads.update({
        where: { id: leadId },
        data: { workflow_id: workflowId },
      });
      this.logger.debug(`Updated workflow_id for lead ${leadId}`);
    } catch (err) {
      this.logger.error(`Failed to update workflow_id for lead ${leadId}`, err);
      throw err;
    }
  }

  async updateExtractedData(
    leadId: number,
    extractedData: {
      customer_name?: string | null;
      customer_number?: string | null;
      customer_address?: string | null;
      service_requested?: string | null;
      provider_lead_id?: string | null;
      lead_metadata?: Record<string, unknown> | null;
    },
  ): Promise<void> {
    try {
      await this.prisma.leads.update({
        where: { id: leadId },
        data: {
          customer_name: extractedData.customer_name ?? undefined,
          customer_number: extractedData.customer_number ?? undefined,
          customer_address: extractedData.customer_address ?? undefined,
          service_requested: extractedData.service_requested ?? undefined,
          provider_lead_id: extractedData.provider_lead_id ?? undefined,
          lead_metadata: extractedData.lead_metadata
            ? (extractedData.lead_metadata as unknown as Prisma.InputJsonValue)
            : undefined,
        },
      });
      this.logger.debug(`Updated extracted data for lead ${leadId}`);
    } catch (err) {
      this.logger.error(
        `Failed to update extracted data for lead ${leadId}`,
        err,
      );
      throw err;
    }
  }

  private determineProvider(from: string): string {
    if (!from) return 'Unknown';

    const fromLower = from.toLowerCase();

    // Check for Yelp
    if (fromLower.includes('yelp') || fromLower.includes('yelp.com')) {
      return 'Yelp';
    }

    // Check for Angi
    if (
      fromLower.includes('angi') ||
      fromLower.includes('angieslist') ||
      fromLower.includes('angies-list')
    ) {
      return 'Angi';
    }

    // Check for Google
    if (
      fromLower.includes('google') ||
      fromLower.includes('google.com') ||
      fromLower.includes('googleservice')
    ) {
      return 'Google LSA';
    }

    // Check for HomeAdvisor
    if (
      fromLower.includes('homeadvisor') ||
      fromLower.includes('home-advisor')
    ) {
      return 'HomeAdvisor';
    }

    // Check for Thumbtack
    if (fromLower.includes('thumbtack') || fromLower.includes('thumb-tack')) {
      return 'Thumbtack';
    }

    return 'Unknown';
  }
}
