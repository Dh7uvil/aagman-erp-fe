import { InkDayReportSchema, type InkDayReportRow } from "@/modules/inventory/ink-movements/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const inkMovementsApi = {
  report: async (
    startDate: string,
    endDate: string,
    opts: { include_column_totals?: boolean } = {},
  ): Promise<ListResponse<InkDayReportRow[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/ink-movements/report", {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_column_totals: opts.include_column_totals,
      },
    });
    return { data: InkDayReportSchema.parse(result.data), meta: result.meta };
  },
};
