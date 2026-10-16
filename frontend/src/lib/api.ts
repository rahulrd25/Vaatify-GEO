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
