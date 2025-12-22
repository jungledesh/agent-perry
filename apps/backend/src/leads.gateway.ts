import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import type { Leads } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: process.env.DASHBOARD_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class LeadsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LeadsGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitLeadCreated(lead: Leads) {
    this.logger.debug(`Emitting lead created event for lead ${lead.id}`);
    this.server.emit('lead:created', lead);
  }

  emitLeadUpdated(lead: Leads) {
    this.logger.debug(`Emitting lead updated event for lead ${lead.id}`);
    this.server.emit('lead:updated', lead);
  }
}
