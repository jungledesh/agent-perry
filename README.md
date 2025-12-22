# Email Leads Agent

> Production-grade system for ingesting, extracting, and processing customer leads from email notifications using AI-powered extraction and Temporal workflows.

[![LangSmith](https://img.shields.io/badge/LangSmith-Prompt%20Management-blue)](https://docs.smith.langchain.com/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com/)
[![Zod](https://img.shields.io/badge/Zod-Schema%20Validation-3E63DD?logo=zod)](https://zod.dev/)
[![Temporal](https://img.shields.io/badge/Temporal-Workflow%20Orchestration-FFCD1E?logo=temporal)](https://temporal.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo)](https://turbo.build/)

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup and Installation](#setup-and-installation)
- [API Reference](#api-reference)
- [Workflow & Data Flow](#workflow--data-flow)
- [Configuration](#configuration)
- [Sample Cases](#sample-cases)
- [Improvements](#improvements)

## Overview

The Email Leads Agent automates the processing of customer leads received via email from lead generation providers (Yelp, Angi, Google LSA, HomeAdvisor, Thumbtack, etc.). The system extracts structured customer information using AI, stores it in a database, and triggers communication workflows—all without requiring direct API integrations from providers.

### Key Features

- **Real-time Email Ingestion**: Webhook-based email ingestion via AgentMail
- **AI-Powered Extraction**: LangChain + OpenAI for structured data extraction from unstructured emails
- **Workflow Orchestration**: Temporal workflows for reliable, retryable lead processing
- **Real-time Dashboard**: Next.js dashboard with WebSocket updates for live lead monitoring
- **Provider Detection**: Automatic detection of lead source from email metadata
- **Error Handling**: Comprehensive error handling with status tracking and alerts
- **Scalable Architecture**: Monorepo structure with separate backend, temporal, and dashboard apps

### Use Case

Many small lead generation providers don't offer direct API integrations but notify clients of new leads via email. This system:

1. Receives emails via webhook
2. Extracts customer information using AI
3. Stores the data in a database
4. Triggers communication workflows
5. Provides a dashboard for monitoring and management

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Email Providers                          │
│  (Yelp, Angi, Google LSA, HomeAdvisor, Thumbtack, etc.)         │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             │ Email
                             ▼
                    ┌─────────────────┐
                    │   AgentMail     │
                    │  Email Service  │
                    └────────┬────────┘
                             │
                             │ POST /webhooks
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  WebhookController                                         │ │
│  │  • Receives email webhooks                                 │ │
│  │  • Creates lead record (status: "new")                     │ │
│  │  • Starts Temporal workflow                                │ │
│  │  • Emits WebSocket event                                   │ │
│  └───────────────────────┬────────────────────────────────────┘ │
│                          │                                      │
│  ┌───────────────────────▼────────────────────────────────────┐ │
│  │  LeadsController                                           │ │
│  │  • GET /leads (paginated, filtered)                        │ │
│  │  • GET /leads/providers                                    │ │
│  │  • POST /leads/notify-update                              │ │
│  └───────────────────────┬────────────────────────────────────┘ │
│                          │                                      │
│  ┌───────────────────────▼────────────────────────────────────┐ │
│  │  LeadsGateway (WebSocket)                                  │ │
│  │  • Real-time lead updates                                  │ │
│  │  • Events: lead:created, lead:updated                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ Temporal Workflow
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Temporal Worker                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  processLead Workflow                                      │ │
│  │  1. extractMetadata (LangChain + OpenAI)                  │ │
│  │  2. persistExtractedData (Prisma)                          │ │
│  │  3. triggerCommunication (HTTP POST)                      │ │
│  │  4. updateStatus (Prisma)                                  │ │
│  └───────────────────────┬────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
        ┌───────────┐ ┌──────────┐ ┌──────────────┐
        │ LangSmith │ │  OpenAI  │ │   Prisma     │
        │   Hub     │ │    API   │ │   Database   │
        └───────────┘ └──────────┘ └──────────────┘
                             │
                             │ WebSocket Events
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Dashboard (Next.js)                             │
│  • Real-time lead display                                        │
│  • Provider filtering                                            │
│  • Pagination                                                    │
│  • WebSocket client                                              │
└──────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | NestJS 11, Prisma ORM, SQLite, Socket.IO |
| **Temporal Worker** | Node.js, Temporal SDK, LangChain, OpenAI GPT |
| **Dashboard** | Next.js 16, React 19, Tailwind CSS |
| **Infrastructure** | Turborepo, AgentMail, Temporal, LangSmith |

### Data Flow

1. **Email Reception**: Email provider sends email payload to `/webhooks`
2. **Lead Creation**: Backend creates lead record with status "new" → stores raw email data
3. **Workflow Initiation**: Backend starts Temporal workflow with email content
4. **Extraction**: Temporal activity calls OpenAI via LangChain prompt (from LangSmith) to extract structured data
5. **Persistence**: Extracted data saved to database, updating lead record
6. **Communication**: Webhook sent to `COMMS_WEBHOOK_URL` with lead data
7. **Status Update**: Lead status updated to "processed" or "failed"
8. **Real-time Updates**: WebSocket events emitted for dashboard updates

---

## Setup and Installation

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **npm** | Latest | Package manager |
| **Temporal Server** | Latest | Workflow orchestration |
| **AgentMail Account** | - | Email service |
| **OpenAI API Key** | - | AI extraction |
| **LangSmith Account** | - | Prompt management |

### Monorepo Setup

```bash
# Clone repository
git clone <repository-url>
cd agent-perry

# Install dependencies
npm install
```

### Backend Setup

```bash
cd apps/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Set up AgentMail webhook (runs automatically on start)
npm run setup

# Start backend
npm run dev
```

The backend will run on `http://localhost:3000` by default.

### Temporal Worker Setup

```bash
cd apps/temporal

# Install dependencies
npm install

# Ensure Temporal server is running
# Local: temporal server start-dev
# Or use Temporal Cloud

# Start worker
npm run dev
```

The worker will connect to Temporal at `localhost:7233` by default.

### Dashboard Setup

```bash
cd apps/dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with backend URL

# Start dashboard
npm run dev
```

The dashboard will run on `http://localhost:3001` by default.

### Database Migration (Existing Data)

If you have existing leads with `provider_lead_id = 'pending-action'`, update them:

```bash
cd apps/backend
npx ts-node src/update-provider-lead-ids.ts
```

---

## API Reference

### Webhook Endpoints

#### `POST /webhooks`

Receives email notifications from AgentMail.

**Request Body** (Zod-validated):

```typescript
{
  event_id: string;
  event_type: "message.received";
  message: {
    message_id?: string;
    subject: string;
    text: string;
    extracted_text?: string;
    from: string;
    from_: string;
    inbox_id: string;
    organization_id?: string;
    timestamp?: string; // ISO 8601
  };
  thread?: {
    thread_id?: string;
    subject?: string;
  };
}
```

**Response**: `200 OK` (void)

**Behavior**:
1. Creates lead record in database with status "new"
2. Determines provider from email `from_` field
3. Stores essential raw email data (excludes large HTML)
4. Starts Temporal workflow for extraction
5. Emits WebSocket event `lead:created`
6. Returns immediately (async processing)

**Error Handling**:
- `400 Bad Request`: Invalid webhook payload
- Validation errors logged and returned

### REST API Endpoints

#### `GET /leads`

Fetches paginated leads with optional filtering.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `org_id` | string | No | - | Filter by organization ID |
| `provider` | string | No | - | Filter by provider name |
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 20 | Results per page |

**Example Request**:

```bash
GET /leads?provider=Yelp&page=1&limit=20
```

**Response**:

```typescript
{
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}
```

**Lead Object**:

```typescript
{
  id: number;
  customer_name: string | null;
  customer_number: string; // "pending-extraction" if not extracted
  customer_address: string | null;
  provider: string;
  provider_lead_id: string | null; // "not provided" if missing
  org_id: string;
  status: "new" | "processed" | "failed" | "pending";
  lead_raw_data: {
    event_id?: string;
    message?: {
      subject?: string;
      text?: string;
      from?: string;
    };
  };
  chat_channel: string | null;
  service_requested: string | null;
  workflow_id: string | null;
  lead_metadata: Record<string, unknown> | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

#### `GET /leads/providers`

Returns list of all unique providers in the database.

**Response**:

```typescript
string[] // e.g., ["Yelp", "Angi", "Google LSA", "Unknown"]
```

#### `POST /leads/notify-update`

Internal endpoint called by Temporal activities to notify of lead updates.

**Request Body**:

```typescript
{
  leadId: number;
}
```

**Response**: `200 OK` (void)

**Behavior**: Emits WebSocket event `lead:updated` for the specified lead.

### WebSocket Events

**Connection**: Connect to backend WebSocket server (same origin as REST API)

**Events Emitted by Server**:

| Event | Payload | Description |
|-------|---------|-------------|
| `lead:created` | `Lead` | Emitted when a new lead is created |
| `lead:updated` | `Lead` | Emitted when a lead is updated |

**Example Client Code**:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('lead:created', (lead: Lead) => {
  console.log('New lead:', lead);
});

socket.on('lead:updated', (lead: Lead) => {
  console.log('Lead updated:', lead);
});
```

### Communication Trigger Endpoint

The system triggers communication by sending a POST request to the `COMMS_WEBHOOK_URL` environment variable.

**Endpoint**: Configured via `COMMS_WEBHOOK_URL` environment variable

**Request**:

```typescript
POST <COMMS_WEBHOOK_URL>
Content-Type: application/json

{
  leadId: number;
  extractedData: {
    customer_name: string | null;
    customer_number: string | null;
    customer_address: string | null;
    service_requested: string | null;
    provider_lead_id: string | null;
    provider: string | null;
    lead_metadata: Record<string, unknown> | null;
  };
}
```

**Response**: Expected `200 OK` (any response is accepted, failures are logged but don't fail workflow)

**Behavior**:
- Called by Temporal `triggerCommunication` activity
- Non-blocking: failures are logged but don't fail the workflow
- Used to initiate SMS/call workflows in external communication service

---

## Workflow & Data Flow

### Temporal Workflow: `processLead`

**Trigger**: Started by backend when webhook is received

**Input**:

```typescript
{
  leadId: number;
  emailBody: string;
  emailSubject: string;
}
```

**Activities (Sequential)**:

| Activity | Description | Retry Policy |
|----------|-------------|--------------|
| `extractMetadata` | Fetches prompt from LangSmith Hub, calls OpenAI GPT, parses JSON response | 3 attempts, 1s initial interval |
| `persistExtractedData` | Updates lead record with extracted fields, stores metadata | 3 attempts, 1s initial interval |
| `triggerCommunication` | Sends POST to `COMMS_WEBHOOK_URL` | Non-blocking (failures logged) |
| `updateStatus` | Updates lead status to "processed" or "failed" | 3 attempts, 1s initial interval |

**Error Handling**:
- If any activity fails after retries, workflow updates status to "failed"
- Errors are logged with structured context
- Workflow throws `WorkflowError` with descriptive message

**Alerts**:
- Missing phone number: Logged as warning with `[ALERT]` prefix

### Lead Status Lifecycle

```
new → processing → processed
                ↓
              failed
```

| Status | Description |
|--------|-------------|
| `new` | Initial state when lead is created |
| `processing` | Implicit state during workflow execution |
| `processed` | Successfully extracted and communication triggered |
| `failed` | Workflow failed or extraction unsuccessful |

---

## Configuration

### Environment Variables

#### Backend (`apps/backend/.env`)

**Required**:

| Variable | Description | Example |
|----------|-------------|---------|
| `AGENTMAIL_API_KEY` | AgentMail API key | `your_agentmail_api_key` |
| `AGENTMAIL_WEBHOOK_URL` | Full URL for webhooks | `https://your-domain.com/webhooks` |
| `AGENTMAIL_INBOX_ID` or `AGENTMAIL_INBOX_DISPLAY_NAME` | Inbox identifier | `Lead Inbox` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `TEMPORAL_ADDRESS` | Temporal server address | `localhost:7233` |
| `TASK_QUEUE` | Temporal task queue name | `lead-processing` |

**Optional**:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `DASHBOARD_URL` | Dashboard URL for CORS | `http://localhost:3001` |
| `DEBUG` | Enable debug logging | `false` |

#### Temporal Worker (`apps/temporal/.env`)

**Required**:

| Variable | Description | Example |
|----------|-------------|---------|
| `LANGSMITH_API_KEY` | LangSmith API key | `your_langsmith_api_key` |
| `LANGSMITH_USERNAME` | LangSmith username | `your_username` |
| `LANGSMITH_PROMPT_NAME` | Prompt name in LangSmith Hub | `your-org/email-lead-extraction` |
| `OPENAI_API_KEY` | OpenAI API key | `your_openai_api_key` |
| `DATABASE_URL` | SQLite database path | `file:../backend/dev.db` |
| `TEMPORAL_ADDRESS` | Temporal server address | `localhost:7233` |
| `TASK_QUEUE` | Temporal task queue name | `lead-processing` |
| `BACKEND_URL` | Backend API URL | `http://localhost:3000` |

**Optional**:

| Variable | Description | Default |
|----------|-------------|---------|
| `COMMS_WEBHOOK_URL` | Communication service webhook URL | - (skipped if not set) |

#### Dashboard (`apps/dashboard/.env.local`)

**Required**:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |

---

## Sample Cases

### Google Local Services Ads - Booking Lead

**Subject**: `New Booking Lead from Local Services Ads`

**Body**:
```
New Booking Request from Google Local Services Ads!

📆 Date & Time: 12/22/2025 14:30  
📍 Service Requested: AC Repair

Booking Details:
Customer Name: Robert Johnson
Preferred Date: 12/22/2025
Preferred Time: 1:00 PM
Notes: "Customer noted that the unit is making a loud buzzing sound and not blowing cold air."

Please visit your Local Services Ads dashboard to view and manage this booking.

Thank you,  
Google Local Services Ads Team
```

**Expected Extraction**:

```json
{
  "customer_name": "Robert Johnson",
  "customer_number": null,
  "customer_address": null,
  "service_requested": "AC Repair",
  "provider_lead_id": null,
  "provider": "Google LSA",
  "lead_metadata": {
    "booking_date": "12/22/2025",
    "booking_time": "1:00 PM",
    "notes": "Customer noted that the unit is making a loud buzzing sound and not blowing cold air.",
    "lead_type": "booking"
  }
}
```

**Note**: Phone number and address may not be present in booking emails. System will alert if phone number is missing.

---

### Google Local Services Ads - Phone Lead

**Subject**: `New Phone Lead from Google Local Services Ads`

**Body**:
```
New Phone Lead Received!

You have a new phone lead from your Local Services Ad.

📞 Lead Type: Phone Call  
📍 Location: Los Angeles, CA  
Date & Time: 12/20/2025 10:15 AM

The potential customer called your Google Local Services Ad number.  
Please check your Google Local Services Ads inbox or app for more details.

Thank you,  
Google Local Services Ads Team
```

**Expected Extraction**:

```json
{
  "customer_name": null,
  "customer_number": null,
  "customer_address": "Los Angeles, CA",
  "service_requested": null,
  "provider_lead_id": null,
  "provider": "Google LSA",
  "lead_metadata": {
    "lead_type": "phone_call",
    "call_date": "12/20/2025",
    "call_time": "10:15 AM",
    "location": "Los Angeles, CA"
  }
}
```

**Note**: Phone leads may not include customer details. System will alert for missing phone number.

---

### Yelp - Message Lead

**Subject**: `New Message from a Potential Customer on Yelp`

**Body**:
```
Yelp for Business

Hi [Your Business Name],

You've received a new message from John D. in San Francisco, CA:

Message: "Hi, I need a quote for fixing a leaky faucet in my kitchen. Can you provide availability this week?"

Service Category: Plumbing

To reply, simply respond to this email (your response will be sent through Yelp). For full details or to continue the conversation, log in to your Yelp Business Inbox: [Link to Dashboard]

Thanks,
The Yelp Team

P.S. Respond within 24 hours to improve your response rate!
```

**Expected Extraction**:

```json
{
  "customer_name": "John D.",
  "customer_number": null,
  "customer_address": "San Francisco, CA",
  "service_requested": "Fixing a leaky faucet in my kitchen",
  "provider_lead_id": null,
  "provider": "Yelp",
  "lead_metadata": {
    "lead_type": "message",
    "message": "Hi, I need a quote for fixing a leaky faucet in my kitchen. Can you provide availability this week?",
    "service_category": "Plumbing",
    "response_deadline": "24 hours"
  }
}
```

---

### Angi - New Lead

**From**: `newlead@angi.com`  
**Subject**: `You Have a New Plumbing Lead!`

**Body**:
```
Angi Leads

New Lead Alert

Customer Name: John Smith
Phone Number: 123-123-1234
Address: 123 Merry Lane, San Diego, CA 92101
ZIP Code: 92101

Job Category: Plumbing
Job Description: Need help unclogging a kitchen drain. Available this week?

To contact this customer or view more details, log in to your Angi Pro app: [Link to Dashboard/App]

Respond quickly to improve your match rate!

Angi Support: (877) 947-3639
```

**Expected Extraction**:

```json
{
  "customer_name": "John Smith",
  "customer_number": "123-123-1234",
  "customer_address": "123 Merry Lane, San Diego, CA 92101",
  "service_requested": "Plumbing - Unclogging a kitchen drain",
  "provider_lead_id": null,
  "provider": "Angi",
  "lead_metadata": {
    "job_category": "Plumbing",
    "job_description": "Need help unclogging a kitchen drain. Available this week?",
    "zip_code": "92101",
    "urgency": "this week"
  }
}
```

---

### Edge Case: Missing Phone Number

**Subject**: `New Lead - No Contact Info`

**Body**:
```
Hello,

We have a new lead for your business.

Customer Name: Sarah Williams
Address: 321 Elm Street, Portland, OR 97201
Service: Electrical wiring

Note: Customer did not provide phone number. Please contact via email: sarah.w@email.com

Lead ID: UNK-001
```

**Expected Extraction**:

```json
{
  "customer_name": "Sarah Williams",
  "customer_number": null,
  "customer_address": "321 Elm Street, Portland, OR 97201",
  "service_requested": "Electrical wiring",
  "provider_lead_id": "UNK-001",
  "provider": "Unknown",
  "lead_metadata": {
    "customer_email": "sarah.w@email.com",
    "alert": "Missing phone number"
  }
}
```

**System Behavior**:
- Extraction completes successfully
- Alert logged: `[ALERT] Lead {id}: Customer phone number is missing`
- Workflow continues (does not fail)
- Status updated to "processed"
- Dashboard shows warning indicator for missing phone

---

## Improvements

### Short-term Improvements

1. **Provider Detection Enhancement**
   - Improve provider detection logic to handle more edge cases
   - Add support for additional providers (Thumbtack, HomeAdvisor variations)
   - Implement provider detection confidence scoring

2. **Extraction Accuracy**
   - Fine-tune LangSmith prompt based on real-world performance
   - Add extraction confidence scores to metadata
   - Implement extraction validation rules

3. **Error Recovery**
   - Add manual retry mechanism for failed leads
   - Implement dead-letter queue for permanently failed leads
   - Add admin interface for lead reprocessing

4. **Dashboard Enhancements**
   - Add lead search functionality
   - Implement lead export (CSV/JSON)
   - Add filtering by status, date range
   - Show extraction confidence metrics

5. **Monitoring & Observability**
   - Add structured logging with correlation IDs
   - Implement metrics collection (extraction success rate, processing time)
   - Add health check endpoints
   - Set up alerting for critical failures

### Medium-term Improvements

1. **Database Migration**
   - Migrate from SQLite to PostgreSQL for production scalability
   - Add database connection pooling
   - Implement read replicas for dashboard queries

2. **Caching Layer**
   - Cache provider list to reduce database queries
   - Cache LangSmith prompts to reduce API calls
   - Implement Redis for session management

3. **Rate Limiting & Throttling**
   - Add rate limiting to webhook endpoint
   - Implement request throttling for LLM calls
   - Add queue-based processing for high-volume periods

4. **Multi-tenancy**
   - Add organization-level isolation
   - Implement role-based access control
   - Add organization-specific configuration

5. **Testing**
   - Add unit tests for critical components
   - Implement integration tests for workflows
   - Add E2E tests for dashboard
   - Set up test fixtures for sample emails

### Long-term Improvements

1. **Advanced AI Features**
   - Implement multi-model extraction (try multiple models, pick best result)
   - Add extraction validation using secondary model
   - Implement learning from corrections (fine-tune based on manual fixes)

2. **Scalability**
   - Horizontal scaling for Temporal workers
   - Load balancing for backend API
   - CDN for dashboard static assets
   - Database sharding by organization

3. **Integration Enhancements**
   - Direct CRM integrations (Salesforce, HubSpot)
   - Calendar integration for scheduling
   - SMS/Email sending capabilities (Twilio, SendGrid)
   - Analytics and reporting dashboard

4. **Compliance & Security**
   - GDPR compliance features (data export, deletion)
   - Encryption at rest and in transit
   - Audit logging for all data access
   - SOC 2 compliance preparation

5. **Developer Experience**
   - API documentation (OpenAPI/Swagger)
   - SDK for common integrations
   - Webhook signature verification
   - Developer portal

---

## Related Projects

- [Temporal Documentation](https://docs.temporal.io/)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [AgentMail Documentation](https://agentmail.dev/docs)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues, please contact the development team or open an issue in the repository.

---

**Last Updated**: December 2024  
**Version**: 1.0.0
