import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  InkBrandCreateRequestSchema,
  InkBrandListSchema,
  InkBrandSchema,
  InkBrandUpdateRequestSchema,
  InkLineSchema,
  InkSheetCreateRequestSchema,
  InkSheetListSchema,
  InkSheetSchema,
  InkSheetUpdateRequestSchema,
  InkStockOutRequestSchema,
  type InkBrand,
  type InkBrandCreateRequest,
  type InkBrandListParams,
  type InkBrandUpdateRequest,
  type InkLine,
  type InkLineListItem,
  type InkListParams,
  type InkSheet,
  type InkSheetCreateRequest,
  type InkSheetUpdateRequest,
  type InkStockOutRequest,
} from "@/modules/inventory/inks/schemas";
import { EntityHistoryEntrySchema } from "@/modules/inventory/cylinders/schemas";
import {
  DrumLineHistoryEntrySchema,
  DrumLineHistorySummarySchema,
} from "@/modules/inventory/schemas/drum-line-history";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";
import { z } from "zod";

export const inkBrandsApi = {
  list: async (params: InkBrandListParams = {}): Promise<ListResponse<InkBrand[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/ink-brands", {
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
    return { data: InkBrandListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<InkBrandListParams, "is_active"> = {}): Promise<InkBrand[]> =>
    fetchAllPages((page, pageSize) =>
      inkBrandsApi.list({ page, page_size: pageSize, is_active: params.is_active }),
    ),
  get: async (id: string): Promise<InkBrand> =>
    InkBrandSchema.parse(await apiClient.get(`/inventory/ink-brands/${id}`)),
  create: async (values: InkBrandCreateRequest): Promise<InkBrand> =>
    InkBrandSchema.parse(
      await apiClient.post("/inventory/ink-brands", InkBrandCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: InkBrandUpdateRequest): Promise<InkBrand> =>
    InkBrandSchema.parse(
      await apiClient.patch(`/inventory/ink-brands/${id}`, InkBrandUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<InkBrand> =>
    InkBrandSchema.parse(await apiClient.delete(`/inventory/ink-brands/${id}`)),
};

export const inksApi = {
  list: async (params: InkListParams = {}): Promise<ListResponse<InkLineListItem[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/inks", {
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
    return { data: InkSheetListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<InkSheet> =>
    InkSheetSchema.parse(await apiClient.get(`/inventory/inks/${id}`)),
  create: async (values: InkSheetCreateRequest): Promise<InkSheet> =>
    InkSheetSchema.parse(
      await apiClient.post("/inventory/inks", InkSheetCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: InkSheetUpdateRequest): Promise<InkSheet> =>
    InkSheetSchema.parse(
      await apiClient.patch(`/inventory/inks/${id}`, InkSheetUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<InkSheet> =>
    InkSheetSchema.parse(await apiClient.delete(`/inventory/inks/${id}`)),
  stockOut: async (sheetId: string, values: InkStockOutRequest): Promise<InkLine> =>
    InkLineSchema.parse(
      await apiClient.post(
        `/inventory/inks/${sheetId}/stock-out`,
        InkStockOutRequestSchema.parse(values),
      ),
    ),
  uploadFile: async (id: string, slot: "product_image" | "ink_image", file: File) => {
    const body = new FormData();
    body.set("file", file);
    return InkSheetSchema.parse(await apiClient.postForm(`/inventory/inks/${id}/files/${slot}`, body));
  },
  deleteFile: async (id: string, slot: "product_image" | "ink_image") =>
    InkSheetSchema.parse(await apiClient.delete(`/inventory/inks/${id}/files/${slot}`)),
  fileUrl: (id: string, slot: "product_image" | "ink_image") =>
    `/api/v1/inventory/inks/${id}/files/${slot}`,
  history: async (id: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/inks/${id}/history`, {
      params: { page, page_size: 100 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
  historyAttachmentUrl: (sheetId: string, auditLogId: string) =>
    `/api/v1/inventory/inks/${sheetId}/history-attachments/${auditLogId}`,
  lineHistory: async (lineId: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/ink-lines/${lineId}/history`, {
      params: { page, page_size: 50 },
    });
    return { data: DrumLineHistoryEntrySchema.array().parse(result.data), meta: result.meta };
  },
  lineHistorySummary: async (lineId: string) =>
    DrumLineHistorySummarySchema.parse(
      await apiClient.get(`/inventory/ink-lines/${lineId}/history-summary`),
    ),
};
