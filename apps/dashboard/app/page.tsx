'use client';

import { LeadsList } from '@/components/LeadsList';
import { useState, useEffect } from 'react';
import { fetchProviders } from '@/lib/api';

export default function Home() {
  const [orgId, setOrgId] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    fetchProviders()
      .then(setProviders)
      .catch((err) => console.error('Failed to fetch providers:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Leads Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage customer leads extracted from email notifications
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="org-id" className="block text-sm font-medium text-gray-700">
                Filter by Organization ID (optional)
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  id="org-id"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  placeholder="Enter org_id to filter..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {orgId && (
                  <button
                    onClick={() => setOrgId('')}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                Filter by Provider (optional)
              </label>
              <div className="mt-2 flex gap-2">
                <select
                  id="provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Providers</option>
                  {providers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {provider && (
                  <button
                    onClick={() => setProvider('')}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <LeadsList orgId={orgId || undefined} provider={provider || undefined} />
      </div>
    </div>
  );
}
