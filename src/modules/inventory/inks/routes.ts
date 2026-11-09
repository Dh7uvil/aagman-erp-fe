import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/inks`;

export type InkStockOutSearchParams = {
  company_id?: string | null;
  ink_sheet_id?: string | null;
  ink_line_id?: string | null;
};

export const inkRoutes = {
  list: base,
  report: `${base}/report`,
  new: `${base}/new`,
  stockOut: (params?: InkStockOutSearchParams) => {
    const path = `${base}/stock-out`;
    if (!params) {
      return path;
    }
    const search = new URLSearchParams();
    if (params.company_id) {
      search.set("company_id", params.company_id);
    }
    if (params.ink_sheet_id) {
      search.set("ink_sheet_id", params.ink_sheet_id);
    }
    if (params.ink_line_id) {
      search.set("ink_line_id", params.ink_line_id);
    }
    const query = search.toString();
    return query ? `${path}?${query}` : path;
  },
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
