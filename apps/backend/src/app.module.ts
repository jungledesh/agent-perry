import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { LeadsController } from './leads.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalService } from './temporal/temporal.service';
import { LeadsService } from './leads.service';
import { LeadsGateway } from './leads.gateway';

@Module({
  imports: [],
  controllers: [WebhooksController, LeadsController],
  providers: [PrismaService, LeadsService, TemporalService, LeadsGateway],
  exports: [PrismaService],
})
export class AppModule {}
