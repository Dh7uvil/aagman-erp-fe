import {
  DayReportSchema,
  MovementCreateRequestSchema,
  type DayReportRow,
  type MovementCreateRequest,
} from "@/modules/inventory/movements/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const movementsApi = {
  report: async (
    startDate: string,
    endDate: string,
    opts: { include_column_totals?: boolean } = {},
  ): Promise<ListResponse<DayReportRow[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/material-movements/report", {
      params: {
        start_date: startDate,
        end_date: endDate,
        include_column_totals: opts.include_column_totals,
      },
    });
    return { data: DayReportSchema.parse(result.data), meta: result.meta };
  },
  create: async (values: MovementCreateRequest): Promise<void> => {
    await apiClient.post(
      "/inventory/material-movements",
      MovementCreateRequestSchema.parse(values),
    );
  },
};
