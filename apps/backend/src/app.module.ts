import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TemporalService } from './temporal/temporal.service';
import { LeadsService } from './leads.service';

@Module({
  imports: [],
  controllers: [WebhooksController],
  providers: [PrismaService, LeadsService, TemporalService],
  exports: [PrismaService],
})
export class AppModule {}
