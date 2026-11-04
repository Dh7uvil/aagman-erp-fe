import {
  SolventDayReportSchema,
  type SolventDayReportRow,
} from "@/modules/inventory/solvent-movements/schemas";
import { apiClient } from "@/shared/api/client";

export const solventMovementsApi = {
  report: async (date: string): Promise<SolventDayReportRow[]> =>
    SolventDayReportSchema.parse(
      await apiClient.get("/inventory/solvent-movements/report", { params: { date } }),
    ),
};
