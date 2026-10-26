import { appSegments } from "@/config/app-segments";

const base = `${appSegments.administration}/roles`;

export const roleRoutes = {
  list: base,
} as const;
