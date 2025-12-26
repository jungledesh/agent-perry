import { Test, TestingModule } from '@nestjs/testing';
import { LeadsGateway } from './leads.gateway';
import type { Leads } from '@prisma/client';
import { Server, Socket } from 'socket.io';

describe('LeadsGateway', () => {
  let gateway: LeadsGateway;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

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
    mockSocket = {
      id: 'test-socket-id',
    } as unknown as jest.Mocked<Socket>;

    mockServer = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadsGateway],
    }).compile();

    gateway = module.get<LeadsGateway>(LeadsGateway);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should log when client connects', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'debug');

      gateway.handleConnection(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Client connected: ${mockSocket.id}`,
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should log when client disconnects', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'debug');

      gateway.handleDisconnect(mockSocket);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Client disconnected: ${mockSocket.id}`,
      );
    });
  });

  describe('emitLeadCreated', () => {
    it('should emit lead:created event', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'debug');

      gateway.emitLeadCreated(mockLead);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Emitting lead created event for lead ${mockLead.id}`,
      );
      expect(mockServer.emit).toHaveBeenCalledWith('lead:created', mockLead);
    });
  });

  describe('emitLeadUpdated', () => {
    it('should emit lead:updated event', () => {
      const loggerSpy = jest.spyOn(gateway['logger'], 'debug');

      gateway.emitLeadUpdated(mockLead);

      expect(loggerSpy).toHaveBeenCalledWith(
        `Emitting lead updated event for lead ${mockLead.id}`,
      );
      expect(mockServer.emit).toHaveBeenCalledWith('lead:updated', mockLead);
    });
  });
});
