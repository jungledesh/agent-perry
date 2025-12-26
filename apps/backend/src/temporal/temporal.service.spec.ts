// Mock uuid before any imports
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { TemporalService, TemporalConnectionError } from './temporal.service';
import { Connection, Client } from '@temporalio/client';

// Mock Client before importing
jest.mock('@temporalio/client', () => {
  const mockClient = {
    workflow: {
      start: jest.fn(),
    },
  };

  return {
    Connection: {
      connect: jest.fn(),
    },
    Client: jest.fn().mockImplementation(() => mockClient),
  };
});

describe('TemporalService', () => {
  let service: TemporalService;
  let mockConnection: jest.Mocked<Connection>;
  let mockClient: jest.Mocked<Client>;

  beforeEach(async () => {
    mockConnection = {
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Connection>;

    mockClient = {
      workflow: {
        start: jest.fn(),
      },
    } as unknown as jest.Mocked<Client>;

    // Mock Connection.connect
    (Connection.connect as jest.Mock).mockResolvedValue(mockConnection);

    // Mock Client constructor
    (Client as jest.Mock).mockImplementation(() => mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [TemporalService],
    }).compile();

    service = module.get<TemporalService>(TemporalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize Temporal connection and client', async () => {
      await service.onModuleInit();

      expect(Connection.connect).toHaveBeenCalledWith({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      });
      expect(service['connection']).toBe(mockConnection);
      expect(service['client']).toBeDefined();
    });

    it('should retry connection on failure', async () => {
      (Connection.connect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockConnection);

      await service.onModuleInit();

      expect(Connection.connect).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should throw TemporalConnectionError on max retry failure', async () => {
      (Connection.connect as jest.Mock).mockRejectedValue(
        new Error('Connection failed'),
      );

      await expect(service.onModuleInit()).rejects.toThrow(
        TemporalConnectionError,
      );

      expect(Connection.connect).toHaveBeenCalledTimes(3);
    }, 20000);
  });

  describe('onModuleDestroy', () => {
    it('should close connection on module destroy', async () => {
      service['connection'] = mockConnection;

      await service.onModuleDestroy();

      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle errors gracefully when closing connection', async () => {
      service['connection'] = mockConnection;
      mockConnection.close.mockRejectedValue(new Error('Close error'));

      // Should not throw
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });

    it('should not throw if connection is null', async () => {
      service['connection'] = null;

      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('startProcessLead', () => {
    const mockPayload = {
      subject: 'Test Subject',
      text: 'Test email body',
      leadId: 1,
    };

    beforeEach(() => {
      service['client'] = mockClient;
    });

    it('should start workflow with correct parameters', async () => {
      (mockClient.workflow.start as jest.Mock).mockResolvedValue(undefined);

      const result = await service.startProcessLead(mockPayload);

      expect(result).toContain(`lead-${mockPayload.leadId}-`);
      expect(mockClient.workflow.start).toHaveBeenCalledWith('processLead', {
        taskQueue: process.env.TASK_QUEUE || 'lead-processing',
        workflowId: expect.stringContaining(`lead-${mockPayload.leadId}-`),
        args: [
          {
            leadId: mockPayload.leadId,
            emailBody: mockPayload.text,
            emailSubject: mockPayload.subject,
          },
        ],
      });
    });

    it('should throw TemporalConnectionError if client is not initialized', async () => {
      service['client'] = null;

      await expect(service.startProcessLead(mockPayload)).rejects.toThrow(
        TemporalConnectionError,
      );
      await expect(service.startProcessLead(mockPayload)).rejects.toThrow(
        'Client not initialized',
      );
    });

    it('should throw TemporalConnectionError on workflow start failure', async () => {
      const error = new Error('Workflow start failed');
      (mockClient.workflow.start as jest.Mock).mockRejectedValue(error);

      await expect(service.startProcessLead(mockPayload)).rejects.toThrow(
        TemporalConnectionError,
      );
      await expect(service.startProcessLead(mockPayload)).rejects.toThrow(
        'Workflow start failed',
      );
    });
  });
});
