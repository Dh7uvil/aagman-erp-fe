import { appSegments } from "@/config/app-segments";

export const auditLogRoutes = {
  list: `${appSegments.administration}/audit-logs`,
} as const;
