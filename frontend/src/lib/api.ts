/**
 * Centralized API Base URL and Endpoint Helper.
 * Configured via NEXT_PUBLIC_API_BASE_URL for seamless local/staging/production deployments.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  return (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8005').replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${cleanPath}`;
}
