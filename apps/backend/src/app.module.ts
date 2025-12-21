import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from './leads.service';

@Module({
  imports: [],
  controllers: [WebhooksController],
  providers: [PrismaService, LeadsService],
  exports: [PrismaService],
})
export class AppModule {}
