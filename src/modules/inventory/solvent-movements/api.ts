import {
  SolventDayReportSchema,
  type SolventDayReportRow,
} from "@/modules/inventory/solvent-movements/schemas";
import { apiClient } from "@/shared/api/client";

export const solventMovementsApi = {
  report: async (startDate: string, endDate: string): Promise<SolventDayReportRow[]> =>
    SolventDayReportSchema.parse(
      await apiClient.get("/inventory/solvent-movements/report", {
        params: { start_date: startDate, end_date: endDate },
      }),
    ),
};
