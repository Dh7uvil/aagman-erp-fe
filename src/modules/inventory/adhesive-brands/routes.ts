import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/adhesive-brands`;

export const adhesiveBrandRoutes = {
  list: base,
  new: `${base}/new`,
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
