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
