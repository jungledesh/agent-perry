import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';

@Module({
  imports: [],
  controllers: [WebhooksController],
  providers: [],
})
export class AppModule {}
