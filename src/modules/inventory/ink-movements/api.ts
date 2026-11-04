import { InkDayReportSchema, type InkDayReportRow } from "@/modules/inventory/ink-movements/schemas";
import { apiClient } from "@/shared/api/client";

export const inkMovementsApi = {
  report: async (date: string): Promise<InkDayReportRow[]> =>
    InkDayReportSchema.parse(
      await apiClient.get("/inventory/ink-movements/report", { params: { date } }),
    ),
};
