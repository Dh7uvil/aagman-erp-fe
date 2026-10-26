import {
  DayReportSchema,
  type DayReportRow,
} from "@/modules/inventory/movements/schemas";
import { apiClient } from "@/shared/api/client";

export const movementsApi = {
  report: async (date: string): Promise<DayReportRow[]> =>
    DayReportSchema.parse(await apiClient.get("/inventory/material-movements/report", { params: { date } })),
};
