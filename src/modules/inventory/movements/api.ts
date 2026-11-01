import {
  DayReportSchema,
  MovementCreateRequestSchema,
  type DayReportRow,
  type MovementCreateRequest,
} from "@/modules/inventory/movements/schemas";
import { apiClient } from "@/shared/api/client";

export const movementsApi = {
  report: async (date: string): Promise<DayReportRow[]> =>
    DayReportSchema.parse(await apiClient.get("/inventory/material-movements/report", { params: { date } })),
  create: async (values: MovementCreateRequest): Promise<void> => {
    await apiClient.post(
      "/inventory/material-movements",
      MovementCreateRequestSchema.parse(values),
    );
  },
};
