import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  AdhesiveCodeCreateRequestSchema,
  AdhesiveCodeListSchema,
  AdhesiveCodeSchema,
  AdhesiveCodeUpdateRequestSchema,
  AdhesiveCodeUsageSchema,
  type AdhesiveCode,
  type AdhesiveCodeCreateRequest,
  type AdhesiveCodeListParams,
  type AdhesiveCodeUpdateRequest,
  type AdhesiveCodeUsage,
} from "@/modules/inventory/adhesive-codes/schemas";
import { EntityHistoryEntrySchema } from "@/modules/inventory/cylinders/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";
import { z } from "zod";

export const adhesiveCodesApi = {
  list: async (params: AdhesiveCodeListParams = {}): Promise<ListResponse<AdhesiveCode[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/adhesive-codes", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: AdhesiveCodeListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<AdhesiveCodeListParams, "is_active"> = {}): Promise<AdhesiveCode[]> =>
    fetchAllPages((page, pageSize) =>
      adhesiveCodesApi.list({ page, page_size: pageSize, is_active: params.is_active }),
    ),
  get: async (id: string): Promise<AdhesiveCode> =>
    AdhesiveCodeSchema.parse(await apiClient.get(`/inventory/adhesive-codes/${id}`)),
  usage: async (id: string): Promise<AdhesiveCodeUsage> =>
    AdhesiveCodeUsageSchema.parse(await apiClient.get(`/inventory/adhesive-codes/${id}/usage`)),
  create: async (values: AdhesiveCodeCreateRequest): Promise<AdhesiveCode> =>
    AdhesiveCodeSchema.parse(
      await apiClient.post(
        "/inventory/adhesive-codes",
        AdhesiveCodeCreateRequestSchema.parse(values),
      ),
    ),
  update: async (id: string, values: AdhesiveCodeUpdateRequest): Promise<AdhesiveCode> =>
    AdhesiveCodeSchema.parse(
      await apiClient.patch(
        `/inventory/adhesive-codes/${id}`,
        AdhesiveCodeUpdateRequestSchema.parse(values),
      ),
    ),
  delete: async (id: string): Promise<AdhesiveCode> =>
    AdhesiveCodeSchema.parse(await apiClient.delete(`/inventory/adhesive-codes/${id}`)),
  history: async (id: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/adhesive-codes/${id}/history`, {
      params: { page, page_size: 100 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
};
