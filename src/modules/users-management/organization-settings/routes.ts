import { appSegments } from "@/config/app-segments";

export const organizationSettingsRoutes = {
  list: `${appSegments.administration}/organization-settings`,
} as const;
