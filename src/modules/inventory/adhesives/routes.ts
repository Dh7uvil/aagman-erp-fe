import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/adhesives`;

export type AdhesiveStockOutSearchParams = {
  company_id?: string | null;
  adhesive_sheet_id?: string | null;
  adhesive_line_id?: string | null;
};

export const adhesiveRoutes = {
  list: base,
  report: `${base}/report`,
  new: `${base}/new`,
  stockOut: (params?: AdhesiveStockOutSearchParams) => {
    const path = `${base}/stock-out`;
    if (!params) {
      return path;
    }
    const search = new URLSearchParams();
    if (params.company_id) {
      search.set("company_id", params.company_id);
    }
    if (params.adhesive_sheet_id) {
      search.set("adhesive_sheet_id", params.adhesive_sheet_id);
    }
    if (params.adhesive_line_id) {
      search.set("adhesive_line_id", params.adhesive_line_id);
    }
    const query = search.toString();
    return query ? `${path}?${query}` : path;
  },
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
