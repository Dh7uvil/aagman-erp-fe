import { appSegments } from "@/config/app-segments";

export const warehouseRoutes = {
  list: `${appSegments.administration}/warehouses`,
} as const;
