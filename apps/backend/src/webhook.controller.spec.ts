import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { LeadsService } from './leads.service';
import { TemporalService } from './temporal/temporal.service';
import { LeadsGateway } from './leads.gateway';
import { WebhookDto } from './webhook.dto';
import type { Leads } from '@prisma/client';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let leadsService: jest.Mocked<LeadsService>;
  let temporalService: jest.Mocked<TemporalService>;
  let leadsGateway: jest.Mocked<LeadsGateway>;

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

  const mockWebhookPayload: WebhookDto = {
    event_id: 'test-event-id',
    event_type: 'message.received',
    message: {
      message_id: 'test-message-id',
      subject: 'Test Subject',
      text: 'Test email body content',
      from: 'test@example.com',
      from_: 'Test Sender <test@example.com>',
      to: ['recipient@example.com'],
      timestamp: new Date().toISOString(),
      inbox_id: 'test-inbox',
      organization_id: 'test-org',
    },
  };

  beforeEach(async () => {
    const mockLeadsService = {
      processWebhook: jest.fn(),
      updateWorkflowId: jest.fn(),
    };

    const mockTemporalService = {
      startProcessLead: jest.fn(),
    };

    const mockLeadsGateway = {
      emitLeadCreated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: LeadsService,
          useValue: mockLeadsService,
        },
        {
          provide: TemporalService,
          useValue: mockTemporalService,
        },
        {
          provide: LeadsGateway,
          useValue: mockLeadsGateway,
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    leadsService = module.get(LeadsService);
    temporalService = module.get(TemporalService);
    leadsGateway = module.get(LeadsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('should process webhook and start temporal workflow', async () => {
      const workflowId = 'test-workflow-id';
      leadsService.processWebhook.mockResolvedValue(mockLead);
      temporalService.startProcessLead.mockResolvedValue(workflowId);

      await controller.handleWebhook(mockWebhookPayload);

      expect(leadsService.processWebhook).toHaveBeenCalledWith(
        mockWebhookPayload,
      );
      expect(temporalService.startProcessLead).toHaveBeenCalledWith({
        subject: 'Test Subject',
        text: 'Test email body content',
        leadId: 1,
      });
      expect(leadsService.updateWorkflowId).toHaveBeenCalledWith(1, workflowId);
      expect(leadsGateway.emitLeadCreated).toHaveBeenCalledWith(mockLead);
    });

    it('should use extracted_text when text is not available', async () => {
      const payloadWithExtractedText: WebhookDto = {
        ...mockWebhookPayload,
        message: {
          ...mockWebhookPayload.message,
          text: undefined,
          extracted_text: 'Extracted text content',
        },
      };
      const workflowId = 'test-workflow-id';
      leadsService.processWebhook.mockResolvedValue(mockLead);
      temporalService.startProcessLead.mockResolvedValue(workflowId);

      await controller.handleWebhook(payloadWithExtractedText);

      expect(temporalService.startProcessLead).toHaveBeenCalledWith({
        subject: 'Test Subject',
        text: 'Extracted text content',
        leadId: 1,
      });
    });

    it('should return early if normalized text is empty', async () => {
      const payloadWithEmptyText: WebhookDto = {
        ...mockWebhookPayload,
        message: {
          ...mockWebhookPayload.message,
          text: '',
          extracted_text: '',
        },
      };
      leadsService.processWebhook.mockResolvedValue(mockLead);
      const loggerWarnSpy = jest.spyOn(controller['logger'], 'warn');

      await controller.handleWebhook(payloadWithEmptyText);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        `Empty email body for lead id: ${mockLead.id}`,
      );
      expect(temporalService.startProcessLead).not.toHaveBeenCalled();
      expect(leadsService.updateWorkflowId).not.toHaveBeenCalled();
    });

    it('should trim normalized text', async () => {
      const payloadWithWhitespace: WebhookDto = {
        ...mockWebhookPayload,
        message: {
          ...mockWebhookPayload.message,
          text: '   Test content   ',
        },
      };
      const workflowId = 'test-workflow-id';
      leadsService.processWebhook.mockResolvedValue(mockLead);
      temporalService.startProcessLead.mockResolvedValue(workflowId);

      await controller.handleWebhook(payloadWithWhitespace);

      expect(temporalService.startProcessLead).toHaveBeenCalledWith({
        subject: 'Test Subject',
        text: 'Test content',
        leadId: 1,
      });
    });

    it('should throw BadRequestException on error', async () => {
      const error = new Error('Processing error');
      leadsService.processWebhook.mockRejectedValue(error);

      await expect(
        controller.handleWebhook(mockWebhookPayload),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.handleWebhook(mockWebhookPayload),
      ).rejects.toThrow('Invalid webhook payload');
    });

    it('should handle temporal service errors', async () => {
      const error = new Error('Temporal error');
      leadsService.processWebhook.mockResolvedValue(mockLead);
      temporalService.startProcessLead.mockRejectedValue(error);

      await expect(
        controller.handleWebhook(mockWebhookPayload),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
