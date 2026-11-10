import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  EntityHistoryEntrySchema,
  CylinderFormSchema,
  CylinderListSchema,
  CylinderSchema,
  type Cylinder,
  type CylinderFormValues,
  type CylinderListItem,
  type CylinderListParams,
} from "@/modules/inventory/cylinders/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { z } from "zod";

function toCreatePayload(values: CylinderFormValues) {
  const parsed = CylinderFormSchema.parse(values);
  return {
    company_id: parsed.company_id,
    product_name: parsed.product_name.trim(),
    cylinder_count: Number.parseInt(parsed.cylinder_count, 10),
    cylinders: parsed.size_lines.map((line) => ({
      width: line.width.trim(),
      circumference: line.circumference.trim(),
    })),
    color_count: Number.parseInt(parsed.color_count || "0", 10),
    colors: parsed.color_lines
      .map((line) => ({ name: line.name.trim() }))
      .filter((line) => line.name.length > 0),
    pet_size: parsed.pet_size.trim(),
    cylinder_cost: parsed.cylinder_cost.trim() || null,
    cylinder_location: parsed.cylinder_location.trim() || null,
    remarks: parsed.remarks.trim() || null,
    status: parsed.status,
  };
}

export const cylindersApi = {
  list: async (params: CylinderListParams = {}): Promise<ListResponse<CylinderListItem[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/cylinders", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        company_id: params.company_id,
        include_closed: params.include_closed,
        include_column_totals: params.include_column_totals,
      },
    });
    return { data: CylinderListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string) => CylinderSchema.parse(await apiClient.get(`/inventory/cylinders/${id}`)),
  create: async (values: CylinderFormValues) =>
    CylinderSchema.parse(await apiClient.post("/inventory/cylinders", toCreatePayload(values))),
  update: async (id: string, values: CylinderFormValues) =>
    CylinderSchema.parse(await apiClient.patch(`/inventory/cylinders/${id}`, toCreatePayload(values))),
  delete: async (id: string) => CylinderSchema.parse(await apiClient.delete(`/inventory/cylinders/${id}`)),
  pause: async (id: string, pause_remarks: string | null) =>
    CylinderSchema.parse(await apiClient.post(`/inventory/cylinders/${id}/pause`, { pause_remarks })),
  resume: async (id: string, resume_remarks: string | null) =>
    CylinderSchema.parse(await apiClient.post(`/inventory/cylinders/${id}/resume`, { resume_remarks })),
  history: async (id: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/cylinders/${id}/history`, {
      params: { page, page_size: 50 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
  uploadFile: async (id: string, slot: "cylinder_image" | "challan", file: File) => {
    const body = new FormData();
    body.set("file", file);
    return CylinderSchema.parse(await apiClient.postForm(`/inventory/cylinders/${id}/files/${slot}`, body));
  },
  deleteFile: async (id: string, slot: "cylinder_image" | "challan") =>
    CylinderSchema.parse(await apiClient.delete(`/inventory/cylinders/${id}/files/${slot}`)),
  fileUrl: (id: string, slot: "cylinder_image" | "challan") => `/api/v1/inventory/cylinders/${id}/files/${slot}`,
  historyAttachmentUrl: (cylinderId: string, auditLogId: string) =>
    `/api/v1/inventory/cylinders/${cylinderId}/history-attachments/${auditLogId}`,
};
