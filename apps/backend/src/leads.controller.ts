import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsGateway } from './leads.gateway';

@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadsGateway: LeadsGateway,
  ) {}

  @Get()
  async getLeads(
    @Query('org_id') orgId?: string,
    @Query('provider') provider?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    try {
      this.logger.debug(
        `Fetching leads${orgId ? ` for org_id: ${orgId}` : ''}${provider ? ` for provider: ${provider}` : ''} (page ${page}, limit ${limit})`,
      );
      return await this.leadsService.getLeads(orgId, provider, page, limit);
    } catch (error) {
      this.logger.error('Failed to fetch leads', error);
      throw error;
    }
  }

  @Get('providers')
  async getProviders(): Promise<string[]> {
    try {
      return await this.leadsService.getAllProviders();
    } catch (error) {
      this.logger.error('Failed to fetch providers', error);
      throw error;
    }
  }

  @Post('notify-update')
  async notifyLeadUpdate(@Body() body: { leadId: number }) {
    try {
      const lead = await this.leadsService.getLeadById(body.leadId);
      if (lead) {
        this.leadsGateway.emitLeadUpdated(lead);
        this.logger.debug(`Notified lead update for lead ${body.leadId}`);
      }
    } catch (error) {
      this.logger.error('Failed to notify lead update', error);
    }
  }
}
