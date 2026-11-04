/**
 * Centralized API Base URL and Endpoint Helper.
 * Configured via NEXT_PUBLIC_API_BASE_URL for seamless local/staging/production deployments.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (publicUrl) {
      const cleanUrl = publicUrl.replace(/\/$/, '');
      // Align hostname between localhost and 127.0.0.1 to avoid cross-host loopback blocking
      if (window.location.hostname === 'localhost' && cleanUrl.includes('127.0.0.1')) {
        return cleanUrl.replace('127.0.0.1', 'localhost');
      }
      if (window.location.hostname === '127.0.0.1' && cleanUrl.includes('localhost')) {
        return cleanUrl.replace('localhost', '127.0.0.1');
      }
      return cleanUrl;
    }
    // Default to same-origin relative path (proxied by Next.js rewrites)
    return '';
  }
  return (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8005').replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
}

export interface AuthHeadersOptions {
  apiKey?: string;
  sessionToken?: string | null;
  userId?: string | null;
  contentType?: string;
}

/**
 * Standardized Authorization & Tenant Header Factory.
 * Prioritizes cryptographic Bearer JWT authentication for Supabase user sessions.
 */
export function getAuthHeaders(options?: AuthHeadersOptions): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options?.contentType) {
    headers['Content-Type'] = options.contentType;
  }

  // API Key header for service authentication
  if (options?.apiKey) {
    headers['X-API-Key'] = options.apiKey;
  }

  // Cryptographic Bearer JWT Token
  if (options?.sessionToken) {
    headers['Authorization'] = `Bearer ${options.sessionToken}`;
  }

  // Optional tenant identity hints for dev/compatibility
  if (options?.userId) {
    headers['X-User-Id'] = options.userId;
  }

  return headers;
}

export interface BillingStatus {
  plan: string;
  status: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  prompt_count: number;
  prompt_limit: number | null;
  features: {
    copilot: boolean;
    full_reports: boolean;
  };
}

export async function fetchBillingStatus(authOptions?: AuthHeadersOptions): Promise<BillingStatus> {
  const res = await fetch(apiUrl('/api/v1/billing/status'), {
    headers: getAuthHeaders(authOptions),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch billing status: ${res.statusText}`);
  }
  return res.json();
}

export async function createCheckoutSession(
  plan: 'starter' | 'pro',
  email?: string,
  authOptions?: AuthHeadersOptions
): Promise<string> {
  const res = await fetch(apiUrl('/api/v1/billing/checkout'), {
    method: 'POST',
    headers: getAuthHeaders({ ...authOptions, contentType: 'application/json' }),
    body: JSON.stringify({ plan, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create checkout session.');
  }
  const data = await res.json();
  return data.checkout_url;
}

export async function createCustomerPortalSession(
  authOptions?: AuthHeadersOptions
): Promise<string> {
  const res = await fetch(apiUrl('/api/v1/billing/portal'), {
    method: 'POST',
    headers: getAuthHeaders(authOptions),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to open customer billing portal.');
  }
  const data = await res.json();
  return data.portal_url;
}
