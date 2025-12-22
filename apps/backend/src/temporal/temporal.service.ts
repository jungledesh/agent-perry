import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Connection, Client } from '@temporalio/client';
import * as uuid from 'uuid';

interface ExtractionPayload {
  subject: string;
  text: string;
  leadId: number;
}

class TemporalConnectionError extends Error {
  constructor(
    message: string,
    public cause?: any,
  ) {
    super(message);
  }
}

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalService.name);
  private connection: Connection | null = null;
  private client: Client | null = null;

  async onModuleInit() {
    try {
      this.connection = await this.connectWithRetry(3, 5000); // Retry 3 times with 5s backoff
      this.client = new Client({ connection: this.connection });
      this.logger.log('Temporal client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Temporal connection', error);
      throw new TemporalConnectionError('Temporal init failed', error); // Propagate for app startup failure
    }
  }

  private async connectWithRetry(
    maxAttempts: number,
    backoffMs: number,
  ): Promise<Connection> {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return await Connection.connect({
          address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
        });
      } catch (error: unknown) {
        attempt++;

        // Check if error is an instance of Error
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        this.logger.warn(
          `Connection attempt ${attempt} failed: ${errorMessage}. Retrying in ${backoffMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
    throw new Error('Max connection attempts exceeded');
  }

  async onModuleDestroy() {
    try {
      if (this.connection) {
        await this.connection.close();
        this.logger.log('Temporal connection closed successfully');
      }
    } catch (error) {
      this.logger.error('Error closing Temporal connection', error);
      // Do not throw—allow graceful shutdown
    }
  }

  async startProcessLead(payload: ExtractionPayload): Promise<string> {
    if (!this.client) {
      const err = new TemporalConnectionError('Client not initialized');
      this.logger.error(err.message);
      throw err;
    }
    try {
      const workflowId = `lead-${payload.leadId}-${uuid.v4()}`;
      await this.client.workflow.start('processLead', {
        taskQueue: process.env.TASK_QUEUE || 'lead-processing',
        workflowId,
        args: [
          {
            leadId: payload.leadId,
            emailBody: payload.text,
            emailSubject: payload.subject,
          },
        ],
      });
      this.logger.debug(`Started workflow ${workflowId}`);
      return workflowId;
    } catch (error) {
      this.logger.error('Failed to start workflow', error);
      throw new TemporalConnectionError('Workflow start failed', error); // Propagate for caller handling
    }
  }
}
