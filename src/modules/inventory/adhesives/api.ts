import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  AdhesiveBrandCreateRequestSchema,
  AdhesiveBrandListSchema,
  AdhesiveBrandSchema,
  AdhesiveBrandUpdateRequestSchema,
  AdhesiveLineSchema,
  AdhesiveSheetCreateRequestSchema,
  AdhesiveSheetListSchema,
  AdhesiveSheetSchema,
  AdhesiveSheetUpdateRequestSchema,
  AdhesiveStockOutRequestSchema,
  type AdhesiveBrand,
  type AdhesiveBrandCreateRequest,
  type AdhesiveBrandListParams,
  type AdhesiveBrandUpdateRequest,
  type AdhesiveLine,
  type AdhesiveLineListItem,
  type AdhesiveListParams,
  type AdhesiveSheet,
  type AdhesiveSheetCreateRequest,
  type AdhesiveSheetUpdateRequest,
  type AdhesiveStockOutRequest,
} from "@/modules/inventory/adhesives/schemas";
import { EntityHistoryEntrySchema } from "@/modules/inventory/cylinders/schemas";
import {
  DrumLineHistoryEntrySchema,
  DrumLineHistorySummarySchema,
} from "@/modules/inventory/schemas/drum-line-history";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";
import { z } from "zod";

export const adhesiveBrandsApi = {
  list: async (params: AdhesiveBrandListParams = {}): Promise<ListResponse<AdhesiveBrand[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/adhesive-brands", {
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
    return { data: AdhesiveBrandListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<AdhesiveBrandListParams, "is_active"> = {}): Promise<AdhesiveBrand[]> =>
    fetchAllPages((page, pageSize) =>
      adhesiveBrandsApi.list({ page, page_size: pageSize, is_active: params.is_active }),
    ),
  get: async (id: string): Promise<AdhesiveBrand> =>
    AdhesiveBrandSchema.parse(await apiClient.get(`/inventory/adhesive-brands/${id}`)),
  create: async (values: AdhesiveBrandCreateRequest): Promise<AdhesiveBrand> =>
    AdhesiveBrandSchema.parse(
      await apiClient.post("/inventory/adhesive-brands", AdhesiveBrandCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: AdhesiveBrandUpdateRequest): Promise<AdhesiveBrand> =>
    AdhesiveBrandSchema.parse(
      await apiClient.patch(
        `/inventory/adhesive-brands/${id}`,
        AdhesiveBrandUpdateRequestSchema.parse(values),
      ),
    ),
  delete: async (id: string): Promise<AdhesiveBrand> =>
    AdhesiveBrandSchema.parse(await apiClient.delete(`/inventory/adhesive-brands/${id}`)),
};

export const adhesivesApi = {
  list: async (params: AdhesiveListParams = {}): Promise<ListResponse<AdhesiveLineListItem[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/adhesives", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        company_id: params.company_id,
      
        include_column_totals: params.include_column_totals,
      },
    });
    return { data: AdhesiveSheetListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<AdhesiveSheet> =>
    AdhesiveSheetSchema.parse(await apiClient.get(`/inventory/adhesives/${id}`)),
  create: async (values: AdhesiveSheetCreateRequest): Promise<AdhesiveSheet> =>
    AdhesiveSheetSchema.parse(
      await apiClient.post("/inventory/adhesives", AdhesiveSheetCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: AdhesiveSheetUpdateRequest): Promise<AdhesiveSheet> =>
    AdhesiveSheetSchema.parse(
      await apiClient.patch(`/inventory/adhesives/${id}`, AdhesiveSheetUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<AdhesiveSheet> =>
    AdhesiveSheetSchema.parse(await apiClient.delete(`/inventory/adhesives/${id}`)),
  stockOut: async (sheetId: string, values: AdhesiveStockOutRequest): Promise<AdhesiveLine> =>
    AdhesiveLineSchema.parse(
      await apiClient.post(
        `/inventory/adhesives/${sheetId}/stock-out`,
        AdhesiveStockOutRequestSchema.parse(values),
      ),
    ),
  history: async (id: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/adhesives/${id}/history`, {
      params: { page, page_size: 100 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
  lineHistory: async (lineId: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/adhesive-lines/${lineId}/history`, {
      params: { page, page_size: 50 },
    });
    return { data: DrumLineHistoryEntrySchema.array().parse(result.data), meta: result.meta };
  },
  lineHistorySummary: async (lineId: string) =>
    DrumLineHistorySummarySchema.parse(
      await apiClient.get(`/inventory/adhesive-lines/${lineId}/history-summary`),
    ),
};
