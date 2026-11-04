import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/ink-colors`;

export const inkColorRoutes = {
  list: base,
  new: `${base}/new`,
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
