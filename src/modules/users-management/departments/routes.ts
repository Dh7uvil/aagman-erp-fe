import { appSegments } from "@/config/app-segments";

export const departmentRoutes = {
  list: `${appSegments.administration}/departments`,
} as const;
