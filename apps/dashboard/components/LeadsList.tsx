'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Lead } from '@/types/lead';
import { fetchLeads, fetchProviders, type LeadsResponse } from '@/lib/api';
import { LeadsWebSocket } from '@/lib/websocket';
import { LeadCard } from './LeadCard';

interface LeadsListProps {
  orgId?: string;
  provider?: string;
}

export function LeadsList({ orgId, provider }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [ws] = useState(() => new LeadsWebSocket());

  const loadLeads = useCallback(async () => {
    try {
      setError(null);
      const data: LeadsResponse = await fetchLeads(orgId, provider, page, limit);
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leads';
      setError(errorMessage);
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, provider, page, limit]);

  const loadProviders = useCallback(async () => {
    try {
      const data = await fetchProviders();
      setProviders(data);
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  }, []);

  useEffect(() => {
    loadLeads();
    loadProviders();
  }, [loadLeads, loadProviders]);

  useEffect(() => {
    // Set up WebSocket listeners
    const handleLeadCreated = (newLead: Lead) => {
      // Update providers list if new provider is encountered
      setProviders((prev) => {
        if (!prev.includes(newLead.provider)) {
          return [...prev, newLead.provider].sort();
        }
        return prev;
      });

      // Only add if it matches current filters
      if (
        (!orgId || newLead.org_id === orgId) &&
        (!provider || newLead.provider === provider)
      ) {
        setLeads((prev) => [newLead, ...prev].slice(0, limit));
        setTotal((prev) => prev + 1);
      }
    };

    const handleLeadUpdated = (updatedLead: Lead) => {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
      );
    };

    // Only set up WebSocket on client side
    if (typeof window !== 'undefined') {
      ws.connect();
      ws.onLeadCreated(handleLeadCreated);
      ws.onLeadUpdated(handleLeadUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        ws.offLeadCreated(handleLeadCreated);
        ws.offLeadUpdated(handleLeadUpdated);
      }
    };
  }, [orgId, provider, limit, ws]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [orgId, provider]);

  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading leads</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadLeads}
                className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No leads found.</p>
        {(orgId || provider) && (
          <p className="mt-2 text-sm text-gray-400">
            {orgId && `Filtered by org_id: ${orgId}`}
            {orgId && provider && ' and '}
            {provider && `provider: ${provider}`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Total Leads ({total})
        </h2>
        <div className="text-xs text-gray-500">
          Real-time updates via WebSocket
        </div>
      </div>

      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * limit, total)}
                </span>{' '}
                of <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 1 && p <= page + 1)
                  )
                  .map((p, idx, arr) => (
                    <div key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          p === page
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
