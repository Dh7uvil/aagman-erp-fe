import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  SolventNameCreateRequestSchema,
  SolventNameListSchema,
  SolventNameSchema,
  SolventNameUpdateRequestSchema,
  SolventNameUsageSchema,
  type SolventName,
  type SolventNameCreateRequest,
  type SolventNameListParams,
  type SolventNameUpdateRequest,
  type SolventNameUsage,
} from "@/modules/inventory/solvent-names/schemas";
import { EntityHistoryEntrySchema } from "@/modules/inventory/cylinders/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";
import { z } from "zod";

export const solventNamesApi = {
  list: async (params: SolventNameListParams = {}): Promise<ListResponse<SolventName[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/solvent-names", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      
        include_column_totals: params.include_column_totals,
      },
    });
    return { data: SolventNameListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<SolventNameListParams, "is_active"> = {}): Promise<SolventName[]> =>
    fetchAllPages((page, pageSize) =>
      solventNamesApi.list({ page, page_size: pageSize, is_active: params.is_active }),
    ),
  get: async (id: string): Promise<SolventName> =>
    SolventNameSchema.parse(await apiClient.get(`/inventory/solvent-names/${id}`)),
  usage: async (id: string): Promise<SolventNameUsage> =>
    SolventNameUsageSchema.parse(await apiClient.get(`/inventory/solvent-names/${id}/usage`)),
  create: async (values: SolventNameCreateRequest): Promise<SolventName> =>
    SolventNameSchema.parse(
      await apiClient.post(
        "/inventory/solvent-names",
        SolventNameCreateRequestSchema.parse(values),
      ),
    ),
  update: async (id: string, values: SolventNameUpdateRequest): Promise<SolventName> =>
    SolventNameSchema.parse(
      await apiClient.patch(
        `/inventory/solvent-names/${id}`,
        SolventNameUpdateRequestSchema.parse(values),
      ),
    ),
  delete: async (id: string): Promise<SolventName> =>
    SolventNameSchema.parse(await apiClient.delete(`/inventory/solvent-names/${id}`)),
  history: async (id: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/solvent-names/${id}/history`, {
      params: { page, page_size: 100 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
};
