import { cylinderReturnRoutes } from "@/modules/inventory/cylinder-returns/routes";
import { jobRoutes } from "@/modules/inventory/jobs/routes";

export const MASTER_HISTORY_PAGE_TITLE = "History";

export type HistoryResourceSpec = {
  slug: string;
  listHref: string;
  label: string;
  /** Records of this resource can carry file uploads, so history shows an Attachments tab. */
  supportsAttachments: boolean;
};

const HISTORY_RESOURCES = [
  {
    slug: "jobs",
    listHref: jobRoutes.list,
    label: "Jobs",
    supportsAttachments: true,
  },
  {
    slug: "cylinder-returns",
    listHref: cylinderReturnRoutes.list,
    label: "Cylinder returns",
    supportsAttachments: false,
  },
] as const satisfies readonly HistoryResourceSpec[];

export type HistoryResource = (typeof HISTORY_RESOURCES)[number]["slug"];

const BY_SLUG = new Map<string, HistoryResourceSpec>(
  HISTORY_RESOURCES.map((resource) => [resource.slug, resource]),
);

export function getHistoryResource(slug: string): HistoryResourceSpec | undefined {
  return BY_SLUG.get(slug);
}

export function isHistoryResource(slug: string): slug is HistoryResource {
  return BY_SLUG.has(slug);
}

export function historyPageTitle(): string {
  return MASTER_HISTORY_PAGE_TITLE;
}

export function historyPageTitleFromHref(href: string): string {
  const pathname = href.split("?")[0] ?? href;
  const match = /^\/history\/([^/]+)\//.exec(pathname);
  if (match) {
    return historyPageTitle();
  }
  return MASTER_HISTORY_PAGE_TITLE;
}

export function historyHref(resource: HistoryResource, id: string, code?: string | null): string {
  const path = `/history/${resource}/${id}`;
  if (!code) {
    return path;
  }
  return `${path}?code=${encodeURIComponent(code)}`;
}

export function historyViewHref(resource: HistoryResource, id: string): string {
  const spec = getHistoryResource(resource);
  if (!spec) {
    return "/";
  }
  return `${spec.listHref}/${id}`;
}
