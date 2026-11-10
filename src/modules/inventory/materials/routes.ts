import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/materials`;

export type MaterialStockOutSearchParams = {
  company_id?: string | null;
  product_id?: string | null;
  parent_id?: string | null;
  material_id?: string | null;
};

export const materialRoutes = {
  list: base,
  report: `${base}/report`,
  new: `${base}/new`,
  /** Fresh create form; pass a new token on each navigation (avoids Next.js route cache reusing form state). */
  newWithReset: (resetToken: string) =>
    `${base}/new?reset=${encodeURIComponent(resetToken)}`,
  stockOut: (params?: MaterialStockOutSearchParams) => {
    const path = `${base}/stock-out`;
    if (!params) {
      return path;
    }
    const search = new URLSearchParams();
    if (params.company_id) {
      search.set("company_id", params.company_id);
    }
    if (params.product_id) {
      search.set("product_id", params.product_id);
    }
    if (params.parent_id) {
      search.set("parent_id", params.parent_id);
    }
    if (params.material_id) {
      search.set("material_id", params.material_id);
    }
    const query = search.toString();
    return query ? `${path}?${query}` : path;
  },
  view: (id: string) => `${base}/${id}`,
  edit: (id: string, micronId?: string | null) => {
    const path = `${base}/${id}/edit`;
    if (!micronId) {
      return path;
    }
    return `${path}?micron=${encodeURIComponent(micronId)}`;
  },
} as const;
