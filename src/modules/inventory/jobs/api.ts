import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  EntityHistoryEntrySchema,
  JobFormSchema,
  JobListSchema,
  JobSchema,
  type Job,
  type JobFormValues,
  type JobListItem,
  type JobListParams,
} from "@/modules/inventory/jobs/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { z } from "zod";

function toCreatePayload(values: JobFormValues) {
  const parsed = JobFormSchema.parse(values);
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
    pet_size: parsed.pet_size.trim() || null,
    cylinder_cost: parsed.cylinder_cost.trim() || null,
    cylinder_location: parsed.cylinder_location.trim() || null,
    remarks: parsed.remarks.trim() || null,
    status: parsed.status,
  };
}

export const jobsApi = {
  list: async (params: JobListParams = {}): Promise<ListResponse<JobListItem[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/jobs", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        company_id: params.company_id,
        include_closed: params.include_closed,
      },
    });
    return { data: JobListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string) => JobSchema.parse(await apiClient.get(`/inventory/jobs/${id}`)),
  create: async (values: JobFormValues) =>
    JobSchema.parse(await apiClient.post("/inventory/jobs", toCreatePayload(values))),
  update: async (id: string, values: JobFormValues) =>
    JobSchema.parse(await apiClient.patch(`/inventory/jobs/${id}`, toCreatePayload(values))),
  delete: async (id: string) => JobSchema.parse(await apiClient.delete(`/inventory/jobs/${id}`)),
  pause: async (id: string, pause_remarks: string | null) =>
    JobSchema.parse(await apiClient.post(`/inventory/jobs/${id}/pause`, { pause_remarks })),
  resume: async (id: string, resume_remarks: string | null) =>
    JobSchema.parse(await apiClient.post(`/inventory/jobs/${id}/resume`, { resume_remarks })),
  history: async (id: string, page = 1) => {
    const result = await apiClient.getList<unknown>(`/inventory/jobs/${id}/history`, {
      params: { page, page_size: 50 },
    });
    return z.array(EntityHistoryEntrySchema).parse(result.data);
  },
  uploadFile: async (id: string, slot: "job_image" | "challan", file: File) => {
    const body = new FormData();
    body.set("file", file);
    return JobSchema.parse(await apiClient.postForm(`/inventory/jobs/${id}/files/${slot}`, body));
  },
  deleteFile: async (id: string, slot: "job_image" | "challan") =>
    JobSchema.parse(await apiClient.delete(`/inventory/jobs/${id}/files/${slot}`)),
  fileUrl: (id: string, slot: "job_image" | "challan") => `/api/v1/inventory/jobs/${id}/files/${slot}`,
  historyAttachmentUrl: (jobId: string, auditLogId: string) =>
    `/api/v1/inventory/jobs/${jobId}/history-attachments/${auditLogId}`,
};
