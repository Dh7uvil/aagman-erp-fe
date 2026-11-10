import {
  AdhesiveDayReportSchema,
  type AdhesiveDayReportRow,
} from "@/modules/inventory/adhesive-movements/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const adhesiveMovementsApi = {
  report: async (
    startDate: string,
    endDate: string,
    opts: { include_column_totals?: boolean } = {},
  ): Promise<ListResponse<AdhesiveDayReportRow[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/adhesive-movements/report", {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_column_totals: opts.include_column_totals,
      },
    });
    return { data: AdhesiveDayReportSchema.parse(result.data), meta: result.meta };
  },
};
