import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  InkColorCreateRequestSchema,
  InkColorListSchema,
  InkColorSchema,
  InkColorUpdateRequestSchema,
  InkColorUsageSchema,
  type InkColor,
  type InkColorCreateRequest,
  type InkColorListParams,
  type InkColorUpdateRequest,
  type InkColorUsage,
  hexCodeToApiValue,
} from "@/modules/inventory/ink-colors/schemas";
import { EntityHistoryEntrySchema } from "@/modules/inventory/cylinders/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";
import { z } from "zod";

export const inkColorsApi = {
  list: async (params: InkColorListParams = {}): Promise<ListResponse<InkColor[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/ink-colors", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: InkColorListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<InkColorListParams, "is_active"> = {}): Promise<InkColor[]> =>
    fetchAllPages((page, pageSize) =>
      inkColorsApi.list({ page, page_size: pageSize, is_active: params.is_active }),
    ),
  get: async (id: string): Promise<InkColor> =>
    InkColorSchema.parse(await apiClient.get(`/inventory/ink-colors/${id}`)),
  usage: async (id: string): Promise<InkColorUsage> =>
    InkColorUsageSchema.parse(await apiClient.get(`/inventory/ink-colors/${id}/usage`)),
  create: async (values: InkColorCreateRequest): Promise<InkColor> =>
    InkColorSchema.parse(
      await apiClient.post(
        "/inventory/ink-colors",
        InkColorCreateRequestSchema.parse({
          ...values,
          hex_code:
            values.hex_code == null ? null : hexCodeToApiValue(values.hex_code),
        }),
      ),
    ),
  update: async (id: string, values: InkColorUpdateRequest): Promise<InkColor> =>
    InkColorSchema.parse(
      await apiClient.patch(
        `/inventory/ink-colors/${id}`,
        InkColorUpdateRequestSchema.parse({
          ...values,
          hex_code:
            values.hex_code === undefined
              ? undefined
              : hexCodeToApiValue(values.hex_code ?? "#"),
        }),
      ),
    ),
  delete: async (id: string): Promise<InkColor> =>
    InkColorSchema.parse(await apiClient.delete(`/inventory/ink-colors/${id}`)),
  history: async (id: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/ink-colors/${id}/history`, {
      params: { page, page_size: 100 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
};
