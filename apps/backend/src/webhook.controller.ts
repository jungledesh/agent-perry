import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { LeadsService } from './leads.service';
import { WebhookSchema } from './webhook.dto';
import type { Leads } from '@prisma/client';
import { TemporalService } from './temporal/temporal.service';

// Create DTO class for type safety and pipe integration
export class WebhookDto extends createZodDto(WebhookSchema) {}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private leadsService: LeadsService,
    private temporalService: TemporalService, // Inject TemporalService
  ) {}

  @Post()
  async handleWebhook(
    @Body(ZodValidationPipe) body: WebhookDto, // Auto-validates with pipe
  ): Promise<void> {
    try {
      // Delegate to service for DB insert
      const createdLead: Leads = await this.leadsService.processWebhook(body);

      this.logger.debug(`Created lead with id: ${createdLead.id}`);

      // Normalize text for extraction (minimal + deterministic)
      const message = body.message;

      const normalizedText = (
        message.text ||
        message.extracted_text ||
        ''
      ).trim();

      if (!normalizedText) {
        this.logger.warn(`Empty email body for lead id: ${createdLead.id}`);
        return;
      }

      const extractionPayload = {
        subject: message.subject,
        text: normalizedText,
        leadId: createdLead.id, // useful later for Temporal correlation
      };

      this.logger.debug('Prepared extraction payload:', extractionPayload);

      // Start Temporal workflow
      const workflowId =
        await this.temporalService.startProcessLead(extractionPayload);

      this.logger.debug(
        `Started Temporal workflow ${workflowId} for lead ${createdLead.id}`,
      );

      // Quick ACK - Nest handles the 200 response implicitly for void returns
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      throw new BadRequestException('Invalid webhook payload'); // Custom error
    }
  }
}
