import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/jobs`;

export const jobRoutes = {
  list: base,
  new: `${base}/new`,
  clone: (id: string) => `${base}/new?clone=${id}`,
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
