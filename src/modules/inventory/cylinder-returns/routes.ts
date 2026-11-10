import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/cylinder-returns`;

export const cylinderReturnRoutes = {
  list: base,
  new: `${base}/new`,
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
