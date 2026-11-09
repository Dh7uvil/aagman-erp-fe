import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  SolventBrandCreateRequestSchema,
  SolventBrandListSchema,
  SolventBrandSchema,
  SolventBrandUpdateRequestSchema,
  SolventLineSchema,
  SolventSheetCreateRequestSchema,
  SolventSheetListSchema,
  SolventSheetSchema,
  SolventSheetUpdateRequestSchema,
  SolventStockOutRequestSchema,
  type SolventBrand,
  type SolventBrandCreateRequest,
  type SolventBrandListParams,
  type SolventBrandUpdateRequest,
  type SolventLine,
  type SolventLineListItem,
  type SolventListParams,
  type SolventSheet,
  type SolventSheetCreateRequest,
  type SolventSheetUpdateRequest,
  type SolventStockOutRequest,
} from "@/modules/inventory/solvents/schemas";
import { EntityHistoryEntrySchema } from "@/modules/inventory/cylinders/schemas";
import {
  DrumLineHistoryEntrySchema,
  DrumLineHistorySummarySchema,
} from "@/modules/inventory/schemas/drum-line-history";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";
import { z } from "zod";

export const solventBrandsApi = {
  list: async (params: SolventBrandListParams = {}): Promise<ListResponse<SolventBrand[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/solvent-brands", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        is_active: params.is_active,
      },
    });
    return { data: SolventBrandListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<SolventBrandListParams, "is_active"> = {}): Promise<SolventBrand[]> =>
    fetchAllPages((page, pageSize) =>
      solventBrandsApi.list({ page, page_size: pageSize, is_active: params.is_active }),
    ),
  get: async (id: string): Promise<SolventBrand> =>
    SolventBrandSchema.parse(await apiClient.get(`/inventory/solvent-brands/${id}`)),
  create: async (values: SolventBrandCreateRequest): Promise<SolventBrand> =>
    SolventBrandSchema.parse(
      await apiClient.post("/inventory/solvent-brands", SolventBrandCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: SolventBrandUpdateRequest): Promise<SolventBrand> =>
    SolventBrandSchema.parse(
      await apiClient.patch(
        `/inventory/solvent-brands/${id}`,
        SolventBrandUpdateRequestSchema.parse(values),
      ),
    ),
  delete: async (id: string): Promise<SolventBrand> =>
    SolventBrandSchema.parse(await apiClient.delete(`/inventory/solvent-brands/${id}`)),
};

export const solventsApi = {
  list: async (params: SolventListParams = {}): Promise<ListResponse<SolventLineListItem[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/solvents", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        company_id: params.company_id,
      },
    });
    return { data: SolventSheetListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<SolventSheet> =>
    SolventSheetSchema.parse(await apiClient.get(`/inventory/solvents/${id}`)),
  create: async (values: SolventSheetCreateRequest): Promise<SolventSheet> =>
    SolventSheetSchema.parse(
      await apiClient.post("/inventory/solvents", SolventSheetCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: SolventSheetUpdateRequest): Promise<SolventSheet> =>
    SolventSheetSchema.parse(
      await apiClient.patch(`/inventory/solvents/${id}`, SolventSheetUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<SolventSheet> =>
    SolventSheetSchema.parse(await apiClient.delete(`/inventory/solvents/${id}`)),
  stockOut: async (sheetId: string, values: SolventStockOutRequest): Promise<SolventLine> =>
    SolventLineSchema.parse(
      await apiClient.post(
        `/inventory/solvents/${sheetId}/stock-out`,
        SolventStockOutRequestSchema.parse(values),
      ),
    ),
  history: async (id: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/solvents/${id}/history`, {
      params: { page, page_size: 100 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
  lineHistory: async (lineId: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/solvent-lines/${lineId}/history`, {
      params: { page, page_size: 50 },
    });
    return { data: DrumLineHistoryEntrySchema.array().parse(result.data), meta: result.meta };
  },
  lineHistorySummary: async (lineId: string) =>
    DrumLineHistorySummarySchema.parse(
      await apiClient.get(`/inventory/solvent-lines/${lineId}/history-summary`),
    ),
};
