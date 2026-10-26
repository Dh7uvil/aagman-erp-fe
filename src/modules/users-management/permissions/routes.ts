import { appSegments } from "@/config/app-segments";

const base = `${appSegments.administration}/permissions`;

export const permissionRoutes = {
  list: base,
  withRole: (roleId: string) => `${base}?role_id=${roleId}`,
} as const;
