import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/materials`;

export const materialRoutes = {
  list: base,
  report: `${base}/report`,
  new: `${base}/new`,
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
