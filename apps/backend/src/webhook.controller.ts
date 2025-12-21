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

// Create DTO class for type safety and pipe integration
export class WebhookDto extends createZodDto(WebhookSchema) {}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private leadsService: LeadsService) {} // Inject the service

  @Post()
  async handleWebhook(
    @Body(ZodValidationPipe) body: WebhookDto, // Auto-validates with pipe
  ): Promise<void> {
    try {
      // Delegate to service for DB insert
      const createdLead: Leads = await this.leadsService.processWebhook(body);

      this.logger.debug(`Created lead with id: ${createdLead.id}`);

      // TODO: Offload to Temporal/queue for async processing (store, extract, etc.)

      // Quick ACK - Nest handles the 200 response implicitly for void returns
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      throw new BadRequestException('Invalid webhook payload'); // Custom error
    }
  }
}
