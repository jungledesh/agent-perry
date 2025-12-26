import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadsGateway } from './leads.gateway';
import type { Leads } from '@prisma/client';

describe('LeadsController', () => {
  let controller: LeadsController;
  let leadsService: jest.Mocked<LeadsService>;
  let leadsGateway: jest.Mocked<LeadsGateway>;

  const mockLead: Leads = {
    id: 1,
    customer_name: 'John Doe',
    customer_number: '555-1234',
    customer_address: '123 Main St',
    service_requested: 'Plumbing',
    provider: 'Google LSA',
    provider_lead_id: 'test-id',
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
    const mockLeadsService = {
      getLeads: jest.fn(),
      getAllProviders: jest.fn(),
      getLeadById: jest.fn(),
    };

    const mockLeadsGateway = {
      emitLeadUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        {
          provide: LeadsService,
          useValue: mockLeadsService,
        },
        {
          provide: LeadsGateway,
          useValue: mockLeadsGateway,
        },
      ],
    }).compile();

    controller = module.get<LeadsController>(LeadsController);
    leadsService = module.get(LeadsService);
    leadsGateway = module.get(LeadsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLeads', () => {
    it('should return leads without filters', async () => {
      const mockResult = {
        leads: [mockLead],
        total: 1,
        page: 1,
        limit: 20,
      };
      leadsService.getLeads.mockResolvedValue(mockResult);

      const result = await controller.getLeads();

      expect(result).toEqual(mockResult);
      expect(leadsService.getLeads).toHaveBeenCalledWith(
        undefined,
        undefined,
        1,
        20,
      );
    });

    it('should return leads with org_id filter', async () => {
      const mockResult = {
        leads: [mockLead],
        total: 1,
        page: 1,
        limit: 20,
      };
      leadsService.getLeads.mockResolvedValue(mockResult);

      const result = await controller.getLeads('test-org');

      expect(result).toEqual(mockResult);
      expect(leadsService.getLeads).toHaveBeenCalledWith(
        'test-org',
        undefined,
        1,
        20,
      );
    });

    it('should return leads with provider filter', async () => {
      const mockResult = {
        leads: [mockLead],
        total: 1,
        page: 1,
        limit: 20,
      };
      leadsService.getLeads.mockResolvedValue(mockResult);

      const result = await controller.getLeads(undefined, 'Google LSA');

      expect(result).toEqual(mockResult);
      expect(leadsService.getLeads).toHaveBeenCalledWith(
        undefined,
        'Google LSA',
        1,
        20,
      );
    });

    it('should return leads with pagination', async () => {
      const mockResult = {
        leads: [mockLead],
        total: 10,
        page: 2,
        limit: 5,
      };
      leadsService.getLeads.mockResolvedValue(mockResult);

      const result = await controller.getLeads(undefined, undefined, 2, 5);

      expect(result).toEqual(mockResult);
      expect(leadsService.getLeads).toHaveBeenCalledWith(
        undefined,
        undefined,
        2,
        5,
      );
    });

    it('should handle errors when fetching leads', async () => {
      const error = new Error('Service error');
      leadsService.getLeads.mockRejectedValue(error);

      await expect(controller.getLeads()).rejects.toThrow('Service error');
    });
  });

  describe('getProviders', () => {
    it('should return all providers', async () => {
      const mockProviders = ['Google LSA', 'Yelp', 'Angi'];
      leadsService.getAllProviders.mockResolvedValue(mockProviders);

      const result = await controller.getProviders();

      expect(result).toEqual(mockProviders);
      expect(leadsService.getAllProviders).toHaveBeenCalled();
    });

    it('should handle errors when fetching providers', async () => {
      const error = new Error('Service error');
      leadsService.getAllProviders.mockRejectedValue(error);

      await expect(controller.getProviders()).rejects.toThrow('Service error');
    });
  });

  describe('notifyLeadUpdate', () => {
    it('should notify lead update when lead exists', async () => {
      leadsService.getLeadById.mockResolvedValue(mockLead);

      await controller.notifyLeadUpdate({ leadId: 1 });

      expect(leadsService.getLeadById).toHaveBeenCalledWith(1);
      expect(leadsGateway.emitLeadUpdated).toHaveBeenCalledWith(mockLead);
    });

    it('should not notify when lead does not exist', async () => {
      leadsService.getLeadById.mockResolvedValue(null);

      await controller.notifyLeadUpdate({ leadId: 999 });

      expect(leadsService.getLeadById).toHaveBeenCalledWith(999);
      expect(leadsGateway.emitLeadUpdated).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Service error');
      leadsService.getLeadById.mockRejectedValue(error);

      // Should not throw
      await expect(
        controller.notifyLeadUpdate({ leadId: 1 }),
      ).resolves.not.toThrow();
    });
  });
});
