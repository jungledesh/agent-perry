'use client';

interface ProviderLinkProps {
  provider: string;
  providerLeadId: string | null;
}

/**
 * Generates provider-specific dashboard links
 */
function getProviderLink(provider: string, providerLeadId: string | null): string | null {
  if (!providerLeadId || providerLeadId === 'not provided') {
    return null;
  }

  const providerLower = provider.toLowerCase();

  // Yelp Business Dashboard
  if (providerLower.includes('yelp')) {
    // Yelp doesn't have a direct lead link, but we can link to business dashboard
    return 'https://biz.yelp.com/';
  }

  // Google LSA Dashboard
  if (providerLower.includes('google') || providerLower.includes('lsa')) {
    return 'https://ads.google.com/aw/localcampaigns';
  }

  // Angi Dashboard
  if (providerLower.includes('angi')) {
    return 'https://www.angi.com/';
  }

  // HomeAdvisor Dashboard
  if (providerLower.includes('homeadvisor')) {
    return 'https://www.homeadvisor.com/';
  }

  // Thumbtack Dashboard
  if (providerLower.includes('thumbtack')) {
    return 'https://www.thumbtack.com/';
  }

  return null;
}

export function ProviderLink({ provider, providerLeadId }: ProviderLinkProps) {
  const link = getProviderLink(provider, providerLeadId);

  if (!link) {
    return (
      <span className="text-sm text-gray-500 italic">not provided</span>
    );
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
    >
      Lead or Platform Link
    </a>
  );
}

