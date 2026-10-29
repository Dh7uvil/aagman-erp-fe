import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CylinderReturnFormSchema,
  CylinderReturnListSchema,
  CylinderReturnSchema,
  type CylinderReturn,
  type CylinderReturnFormValues,
  type CylinderReturnListParams,
} from "@/modules/inventory/cylinder-returns/schemas";
import { EntityHistoryEntrySchema } from "@/modules/inventory/jobs/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { z } from "zod";

export const cylinderReturnsApi = {
  list: async (params: CylinderReturnListParams = {}): Promise<ListResponse<CylinderReturn[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/cylinder-returns", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        company_id: params.company_id,
        job_id: params.job_id,
      },
    });
    return { data: CylinderReturnListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string) =>
    CylinderReturnSchema.parse(await apiClient.get(`/inventory/cylinder-returns/${id}`)),
  create: async (values: CylinderReturnFormValues) => {
    const parsed = CylinderReturnFormSchema.parse(values);
    return CylinderReturnSchema.parse(
      await apiClient.post("/inventory/cylinder-returns", {
        company_id: parsed.company_id,
        job_id: parsed.job_id,
        remarks: parsed.remarks.trim() || null,
      }),
    );
  },
  update: async (id: string, values: Partial<CylinderReturnFormValues>) =>
    CylinderReturnSchema.parse(
      await apiClient.patch(`/inventory/cylinder-returns/${id}`, {
        company_id: values.company_id,
        remarks: values.remarks?.trim() || null,
      }),
    ),
  delete: async (id: string) =>
    CylinderReturnSchema.parse(await apiClient.delete(`/inventory/cylinder-returns/${id}`)),
  history: async (id: string) => {
    const result = await apiClient.getList<unknown>(`/inventory/cylinder-returns/${id}/history`, {
      params: { page: 1, page_size: 50 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
};
