'use client';

import type { Lead } from '@/types/lead';
import { useState } from 'react';
import { ProviderLink } from './ProviderLink';

interface LeadCardProps {
  lead: Lead;
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    processed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  const colorClass = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
      {provider}
    </span>
  );
}

export function LeadCard({ lead }: LeadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRawEmail, setShowRawEmail] = useState(false);

  const emailText =
    lead.lead_raw_data?.message?.text ||
    lead.lead_raw_data?.message?.extracted_text ||
    'No email content available';

  const emailSubject = lead.lead_raw_data?.message?.subject || 'No subject';

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Lead #{lead.id}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(lead.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
            <ProviderBadge provider={lead.provider} />
          </div>
        </div>

        {/* Extracted Fields */}
        <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-500">Customer Name</label>
            <p className="mt-1 text-sm text-gray-900">
              {lead.customer_name || (
                <span className="text-gray-400 italic">Not extracted</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Phone Number</label>
            <p className="mt-1 text-sm text-gray-900">
              {lead.customer_number && lead.customer_number !== 'pending-extraction' ? (
                <a
                  href={`tel:${lead.customer_number}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {lead.customer_number}
                </a>
              ) : (
                <span className="text-yellow-600 font-medium">⚠️ Missing</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Address</label>
            <p className="mt-1 text-sm text-gray-900">
              {lead.customer_address || (
                <span className="text-gray-400 italic">Not extracted</span>
              )}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Service Requested</label>
            <p className="mt-1 text-sm text-gray-900">
              {lead.service_requested || (
                <span className="text-gray-400 italic">Not extracted</span>
              )}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Provider Lead ID: {lead.provider_lead_id === 'not provided' || !lead.provider_lead_id ? 'not provided' : lead.provider_lead_id}</span>
            <span>Org ID: {lead.org_id}</span>
          </div>
          <div className="flex items-center justify-end mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Platform:</span>
              <ProviderLink
                provider={lead.provider}
                providerLeadId={lead.provider_lead_id}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowRawEmail(!showRawEmail)}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            {showRawEmail ? 'Hide' : 'Show'} Raw Email
          </button>
          {lead.lead_metadata && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              {isExpanded ? 'Hide' : 'Show'} Metadata
            </button>
          )}
        </div>

        {/* Raw Email Preview */}
        {showRawEmail && (
          <div className="mt-4 rounded-md bg-gray-50 p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Email Preview</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Subject</label>
                <p className="text-sm text-gray-900">{emailSubject}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">From</label>
                <p className="text-sm text-gray-900">
                  {lead.lead_raw_data?.message?.from || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Body</label>
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-white p-3 text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {emailText}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        {isExpanded && lead.lead_metadata && (
          <div className="mt-4 rounded-md bg-gray-50 p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Extraction Metadata</h4>
            <pre className="max-h-48 overflow-auto rounded bg-white p-3 text-xs text-gray-700">
              {JSON.stringify(lead.lead_metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

