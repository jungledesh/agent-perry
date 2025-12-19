import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
import { WebhookSchema } from './webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  @Post()
  async handleWebhook(
    @Body() body: unknown,
    @Res() res: Response
  ): Promise<void> {
    // Validate with Zod
    const validatedPayload = WebhookSchema.parse(body);  // Throws if invalid

    console.log('Validated payload:', validatedPayload);

    // Now use safely: validatedPayload.event_type, validatedPayload.message.from, etc.

    // TODO: Process (store, Temporal, etc.)

    res.status(200).send();
  }
}