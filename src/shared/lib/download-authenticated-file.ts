import { API_VERSION_PREFIX } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

/** Map browser-facing `/api/v1/...` URLs to paths used by {@link apiClient}. */
export function toApiClientPath(publicPath: string): string {
  if (publicPath.startsWith(API_VERSION_PREFIX)) {
    return publicPath.slice(API_VERSION_PREFIX.length) || "/";
  }
  return publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
}

export function downloadAuthenticatedFile(
  publicPath: string,
  filename: string,
  accept?: string | null,
): Promise<void> {
  return apiClient.downloadFile(toApiClientPath(publicPath), {
    filename,
    accept: accept ?? undefined,
  });
}
