'use client';

interface ExternalLinkProps {
  customerName: string | null;
  customerNumber: string | null;
  customerAddress: string | null;
  serviceRequested: string | null;
}

/**
 * Creates an external link with customer information as URL parameters
 */
export function ExternalLink({
  customerName,
  customerNumber,
  customerAddress,
  serviceRequested,
}: ExternalLinkProps) {
  const params = new URLSearchParams();
  
  if (customerName) params.set('name', customerName);
  if (customerNumber && customerNumber !== 'pending-extraction') {
    params.set('phone', customerNumber);
  }
  if (customerAddress) params.set('address', customerAddress);
  if (serviceRequested) params.set('service', serviceRequested);

  const link = params.toString() 
    ? `?${params.toString()}`
    : '#';

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
      View Details
    </a>
  );
}

