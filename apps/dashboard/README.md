# Email Leads Dashboard

A Next.js dashboard for viewing and managing customer leads extracted from email notifications.

## Features

- **Real-time Lead Display**: View all leads with auto-refresh every 5 seconds
- **Extracted Fields**: Display customer name, phone number, address, and service requested
- **Raw Email Preview**: View the original email content for each lead
- **Status Tracking**: Visual status badges (new, processed, failed, pending)
- **Provider Identification**: See which lead provider each lead came from
- **Organization Filtering**: Filter leads by organization ID
- **Metadata View**: View extraction metadata when available

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000` (or configure via environment variable)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3001`.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **View All Leads**: The dashboard automatically loads and displays all leads
2. **Filter by Organization**: Enter an `org_id` in the filter box to show only leads for that organization
3. **View Details**: Click "Show Raw Email" to see the original email content
4. **View Metadata**: Click "Show Metadata" to see extraction metadata (if available)

## API Integration

The dashboard fetches leads from the backend API:

- **Endpoint**: `GET /leads?org_id=<org_id>`
- **Response**: Array of lead objects matching the Prisma schema

## Components

- `LeadsList`: Main component that fetches and displays leads with polling
- `LeadCard`: Individual lead card component showing extracted fields and metadata

## Tech Stack

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Hooks**: For state management and side effects
