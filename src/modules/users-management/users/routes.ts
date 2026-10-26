import { appSegments } from "@/config/app-segments";

const base = `${appSegments.administration}/users`;

export const userRoutes = {
  list: base,
} as const;
