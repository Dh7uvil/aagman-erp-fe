import { appSegments } from "@/config/app-segments";

const base = `${appSegments.masters}/units`;

export const unitRoutes = {
  list: base,
  new: `${base}/new`,
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
