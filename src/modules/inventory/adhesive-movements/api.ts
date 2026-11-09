import {
  AdhesiveDayReportSchema,
  type AdhesiveDayReportRow,
} from "@/modules/inventory/adhesive-movements/schemas";
import { apiClient } from "@/shared/api/client";

export const adhesiveMovementsApi = {
  report: async (startDate: string, endDate: string): Promise<AdhesiveDayReportRow[]> =>
    AdhesiveDayReportSchema.parse(
      await apiClient.get("/inventory/adhesive-movements/report", {
        params: { start_date: startDate, end_date: endDate },
      }),
    ),
};
