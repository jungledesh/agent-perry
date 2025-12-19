import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller'; 
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [WebhooksController],
  providers: [AppService],
})
export class AppModule {}
