import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CompanyCreateRequestSchema,
  CompanyListSchema,
  CompanySchema,
  CompanyUpdateRequestSchema,
  type Company,
  type CompanyCreateRequest,
  type CompanyListParams,
  type CompanyUpdateRequest,
} from "@/modules/users-management/companies/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const companiesApi = {
  list: async (params: CompanyListParams = {}): Promise<ListResponse<Company[]>> => {
    const result = await apiClient.getList<unknown>("/companies", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      },
    });
    return { data: CompanyListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Company> =>
    CompanySchema.parse(await apiClient.get(`/companies/${id}`)),
  create: async (values: CompanyCreateRequest): Promise<Company> =>
    CompanySchema.parse(await apiClient.post("/companies", CompanyCreateRequestSchema.parse(values))),
  update: async (id: string, values: CompanyUpdateRequest): Promise<Company> =>
    CompanySchema.parse(
      await apiClient.patch(`/companies/${id}`, CompanyUpdateRequestSchema.parse(values)),
    ),
  delete: async (id: string): Promise<Company> =>
    CompanySchema.parse(await apiClient.delete(`/companies/${id}`)),
};
