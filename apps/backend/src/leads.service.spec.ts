import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDto } from './webhook.dto';
import type { Leads } from '@prisma/client';

describe('LeadsService', () => {
  let service: LeadsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockLead: Leads = {
    id: 1,
    customer_name: null,
    customer_number: 'pending-extraction',
    customer_address: null,
    service_requested: null,
    provider: 'Google LSA',
    provider_lead_id: 'test-message-id',
    org_id: 'test-org',
    chat_channel: 'email',
    status: 'new',
    workflow_id: null,
    lead_raw_data: {},
    lead_metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      leads: {
        create: jest.fn().mockResolvedValue(mockLead),
        update: jest.fn().mockResolvedValue(mockLead),
        findMany: jest.fn().mockResolvedValue([mockLead]),
        findUnique: jest.fn().mockResolvedValue(mockLead),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processWebhook', () => {
    const mockWebhookPayload: WebhookDto = {
      event_id: 'test-event-id',
      event_type: 'message.received',
      message: {
        message_id: 'test-message-id',
        subject: 'Test Subject',
        text: 'Test email body',
        from: 'test@example.com',
        from_: 'Test Sender <test@example.com>',
        to: ['recipient@example.com'],
        timestamp: new Date().toISOString(),
        inbox_id: 'test-inbox',
        organization_id: 'test-org',
      },
    };

    it('should create a lead from webhook payload', async () => {
      (prismaService.leads.create as jest.Mock).mockResolvedValue(mockLead);

      const result = await service.processWebhook(mockWebhookPayload);

      expect(result).toEqual(mockLead);
      expect(prismaService.leads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: 'Unknown',
          provider_lead_id: 'test-message-id',
          org_id: 'test-org',
          chat_channel: 'email',
          status: 'new',
          customer_number: 'pending-extraction',
        }),
      });
    });

    it('should determine provider from email sender (Google LSA)', async () => {
      const googlePayload: WebhookDto = {
        ...mockWebhookPayload,
        message: {
          ...mockWebhookPayload.message,
          from_: 'Google Local Services <local-services@google.com>',
        },
      };
      (prismaService.leads.create as jest.Mock).mockResolvedValue({
        ...mockLead,
        provider: 'Google LSA',
      });

      await service.processWebhook(googlePayload);

      expect(prismaService.leads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: 'Google LSA',
        }),
      });
    });

    it('should determine provider from email sender (Yelp)', async () => {
      const yelpPayload: WebhookDto = {
        ...mockWebhookPayload,
        message: {
          ...mockWebhookPayload.message,
          from_: 'Yelp for Business <noreply@yelp.com>',
        },
      };
      (prismaService.leads.create as jest.Mock).mockResolvedValue({
        ...mockLead,
        provider: 'Yelp',
      });

      await service.processWebhook(yelpPayload);

      expect(prismaService.leads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: 'Yelp',
        }),
      });
    });

    it('should determine provider from email sender (Angi)', async () => {
      const angiPayload: WebhookDto = {
        ...mockWebhookPayload,
        message: {
          ...mockWebhookPayload.message,
          from_: 'Angi Leads <newlead@angi.com>',
        },
      };
      (prismaService.leads.create as jest.Mock).mockResolvedValue({
        ...mockLead,
        provider: 'Angi',
      });

      await service.processWebhook(angiPayload);

      expect(prismaService.leads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: 'Angi',
        }),
      });
    });

    it('should use extracted_text if text is not available', async () => {
      const payloadWithExtractedText: WebhookDto = {
        ...mockWebhookPayload,
        message: {
          ...mockWebhookPayload.message,
          text: '',
          extracted_text: 'Extracted text content',
        },
      };
      (prismaService.leads.create as jest.Mock).mockResolvedValue(mockLead);

      await service.processWebhook(payloadWithExtractedText);

      expect(prismaService.leads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          lead_raw_data: expect.objectContaining({
            message: expect.objectContaining({
              text: 'Extracted text content',
            }),
          }),
        }),
      });
    });

    it('should handle errors when creating lead', async () => {
      const error = new Error('Database error');
      (prismaService.leads.create as jest.Mock).mockRejectedValue(error);

      await expect(service.processWebhook(mockWebhookPayload)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updateWorkflowId', () => {
    it('should update workflow_id for a lead', async () => {
      const leadId = 1;
      const workflowId = 'test-workflow-id';
      (prismaService.leads.update as jest.Mock).mockResolvedValue({
        ...mockLead,
        workflow_id: workflowId,
      });

      await service.updateWorkflowId(leadId, workflowId);

      expect(prismaService.leads.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: { workflow_id: workflowId },
      });
    });

    it('should handle errors when updating workflow_id', async () => {
      const error = new Error('Database error');
      (prismaService.leads.update as jest.Mock).mockRejectedValue(error);

      await expect(service.updateWorkflowId(1, 'test-id')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updateExtractedData', () => {
    it('should update extracted data for a lead', async () => {
      const leadId = 1;
      const extractedData = {
        customer_name: 'John Doe',
        customer_number: '555-1234',
        customer_address: '123 Main St',
        service_requested: 'Plumbing',
      };
      (prismaService.leads.update as jest.Mock).mockResolvedValue({
        ...mockLead,
        ...extractedData,
      });

      await service.updateExtractedData(leadId, extractedData);

      expect(prismaService.leads.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: {
          customer_name: extractedData.customer_name,
          customer_number: extractedData.customer_number,
          customer_address: extractedData.customer_address,
          service_requested: extractedData.service_requested,
        },
      });
    });

    it('should handle null values in extracted data', async () => {
      const leadId = 1;
      const extractedData = {
        customer_name: null,
        customer_number: null,
      };
      (prismaService.leads.update as jest.Mock).mockResolvedValue(mockLead);

      await service.updateExtractedData(leadId, extractedData);

      expect(prismaService.leads.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: {
          customer_name: undefined,
          customer_number: undefined,
        },
      });
    });

    it('should handle lead_metadata', async () => {
      const leadId = 1;
      const extractedData = {
        lead_metadata: { key: 'value' },
      };
      (prismaService.leads.update as jest.Mock).mockResolvedValue(mockLead);

      await service.updateExtractedData(leadId, extractedData);

      expect(prismaService.leads.update).toHaveBeenCalledWith({
        where: { id: leadId },
        data: {
          lead_metadata: extractedData.lead_metadata,
        },
      });
    });

    it('should handle errors when updating extracted data', async () => {
      const error = new Error('Database error');
      (prismaService.leads.update as jest.Mock).mockRejectedValue(error);

      await expect(
        service.updateExtractedData(1, { customer_name: 'Test' }),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getLeads', () => {
    it('should fetch leads without filters', async () => {
      const mockLeads = [mockLead];
      (prismaService.leads.findMany as jest.Mock).mockResolvedValue(mockLeads);
      (prismaService.leads.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getLeads();

      expect(result).toEqual({
        leads: mockLeads,
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(prismaService.leads.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should fetch leads with org_id filter', async () => {
      const mockLeads = [mockLead];
      (prismaService.leads.findMany as jest.Mock).mockResolvedValue(mockLeads);
      (prismaService.leads.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getLeads('test-org');

      expect(result.leads).toEqual(mockLeads);
      expect(prismaService.leads.findMany).toHaveBeenCalledWith({
        where: { org_id: 'test-org' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should fetch leads with provider filter', async () => {
      const mockLeads = [mockLead];
      (prismaService.leads.findMany as jest.Mock).mockResolvedValue(mockLeads);
      (prismaService.leads.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getLeads(undefined, 'Google LSA');

      expect(result.leads).toEqual(mockLeads);
      expect(prismaService.leads.findMany).toHaveBeenCalledWith({
        where: { provider: 'Google LSA' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should fetch leads with pagination', async () => {
      const mockLeads = [mockLead];
      (prismaService.leads.findMany as jest.Mock).mockResolvedValue(mockLeads);
      (prismaService.leads.count as jest.Mock).mockResolvedValue(10);

      const result = await service.getLeads(undefined, undefined, 2, 5);

      expect(result).toEqual({
        leads: mockLeads,
        total: 10,
        page: 2,
        limit: 5,
      });
      expect(prismaService.leads.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      });
    });

    it('should handle errors when fetching leads', async () => {
      const error = new Error('Database error');
      (prismaService.leads.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.getLeads()).rejects.toThrow('Database error');
    });
  });

  describe('getAllProviders', () => {
    it('should return all unique providers', async () => {
      (prismaService.leads.findMany as jest.Mock).mockResolvedValue([
        { provider: 'Google LSA' },
        { provider: 'Yelp' },
        { provider: 'Angi' },
      ]);

      const result = await service.getAllProviders();

      expect(result).toEqual(['Google LSA', 'Yelp', 'Angi']);
      expect(prismaService.leads.findMany).toHaveBeenCalledWith({
        select: { provider: true },
        distinct: ['provider'],
      });
    });

    it('should handle errors when fetching providers', async () => {
      const error = new Error('Database error');
      (prismaService.leads.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.getAllProviders()).rejects.toThrow('Database error');
    });
  });

  describe('getLeadById', () => {
    it('should return a lead by id', async () => {
      (prismaService.leads.findUnique as jest.Mock).mockResolvedValue(mockLead);

      const result = await service.getLeadById(1);

      expect(result).toEqual(mockLead);
      expect(prismaService.leads.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null if lead not found', async () => {
      (prismaService.leads.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getLeadById(999);

      expect(result).toBeNull();
    });

    it('should handle errors when fetching lead by id', async () => {
      const error = new Error('Database error');
      (prismaService.leads.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(service.getLeadById(1)).rejects.toThrow('Database error');
    });
  });
});
