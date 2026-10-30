const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export const LOGO_PROXY_PATH = "/api/logo-proxy";

export function isLoopbackLogoUrl(logoUrl: string): boolean {
  try {
    const url = new URL(logoUrl);
    return (
      (url.protocol === "http:" || url.protocol === "https:") && LOOPBACK_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

function withCacheBust(url: string, revision?: string | null): string {
  if (!revision || /[?&]v=/.test(url)) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(revision)}`;
}

/**
 * Presigned MinIO URLs point at 127.0.0.1, which a remote browser (and an HTTPS
 * ngrok tab) cannot load. Same-origin proxy keeps the image reachable.
 * `revision` busts the browser cache when the object path stays the same.
 */
export function toDisplayLogoUrl(
  logoUrl: string | null | undefined,
  revision?: string | null,
): string | undefined {
  if (!logoUrl) {
    return undefined;
  }
  if (logoUrl.startsWith("data:") || logoUrl.startsWith("blob:")) {
    return logoUrl;
  }
  const display = isLoopbackLogoUrl(logoUrl)
    ? `${LOGO_PROXY_PATH}?url=${encodeURIComponent(logoUrl)}`
    : logoUrl;
  return withCacheBust(display, revision);
}
