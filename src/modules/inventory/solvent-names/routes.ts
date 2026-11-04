import { appSegments } from "@/config/app-segments";

const base = `${appSegments.inventory}/solvent-names`;

export const solventNameRoutes = {
  list: base,
  new: `${base}/new`,
  view: (id: string) => `${base}/${id}`,
  edit: (id: string) => `${base}/${id}/edit`,
} as const;
