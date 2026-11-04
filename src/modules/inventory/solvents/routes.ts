import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/solvents`;

export type SolventStockOutSearchParams = {
  company_id?: string | null;
  solvent_sheet_id?: string | null;
  solvent_line_id?: string | null;
};

export const solventRoutes = {
  list: base,
  report: `${base}/report`,
  new: `${base}/new`,
  stockOut: (params?: SolventStockOutSearchParams) => {
    const path = `${base}/stock-out`;
    if (!params) {
      return path;
    }
    const search = new URLSearchParams();
    if (params.company_id) {
      search.set("company_id", params.company_id);
    }
    if (params.solvent_sheet_id) {
      search.set("solvent_sheet_id", params.solvent_sheet_id);
    }
    if (params.solvent_line_id) {
      search.set("solvent_line_id", params.solvent_line_id);
    }
    const query = search.toString();
    return query ? `${path}?${query}` : path;
  },
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
