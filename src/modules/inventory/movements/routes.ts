import { materialRoutes } from "@/modules/inventory/materials/routes";

export const movementRoutes = {
  list: materialRoutes.report,
} as const;
