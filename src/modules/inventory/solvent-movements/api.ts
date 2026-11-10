import {
  SolventDayReportSchema,
  type SolventDayReportRow,
} from "@/modules/inventory/solvent-movements/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const solventMovementsApi = {
  report: async (
    startDate: string,
    endDate: string,
    opts: { include_column_totals?: boolean } = {},
  ): Promise<ListResponse<SolventDayReportRow[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/solvent-movements/report", {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_column_totals: opts.include_column_totals,
      },
    });
    return { data: SolventDayReportSchema.parse(result.data), meta: result.meta };
  },
};
