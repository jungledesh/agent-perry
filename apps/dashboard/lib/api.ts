import type { Lead } from '@/types/lead';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetches leads from the backend API
 * @param orgId Optional organization ID to filter leads
 * @param provider Optional provider to filter leads
 * @param page Page number (1-indexed)
 * @param limit Number of leads per page
 * @returns Promise resolving to paginated leads response
 */
export async function fetchLeads(
  orgId?: string,
  provider?: string,
  page: number = 1,
  limit: number = 20,
): Promise<LeadsResponse> {
  const url = new URL(`${API_BASE_URL}/leads`);
  if (orgId) {
    url.searchParams.set('org_id', orgId);
  }
  if (provider) {
    url.searchParams.set('provider', provider);
  }
  url.searchParams.set('page', page.toString());
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch leads: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Fetches all available providers
 * @returns Promise resolving to an array of provider names
 */
export async function fetchProviders(): Promise<string[]> {
  const url = new URL(`${API_BASE_URL}/leads/providers`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch providers: ${response.status} ${errorText}`);
  }

  return response.json();
}

