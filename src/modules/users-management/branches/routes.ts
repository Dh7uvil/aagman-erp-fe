import { appSegments } from "@/config/app-segments";

export const branchRoutes = {
  list: `${appSegments.administration}/branches`,
} as const;
