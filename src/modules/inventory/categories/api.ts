import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CategoryCreateRequestSchema,
  CategoryListSchema,
  CategorySchema,
  CategoryUpdateRequestSchema,
  type Category,
  type CategoryCreateRequest,
  type CategoryUpdateRequest,
} from "@/modules/inventory/categories/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const categoriesApi = {
  listAll: (companyId?: string): Promise<Category[]> =>
    fetchAllPages((page, pageSize) =>
      categoriesApi.list({ page, page_size: pageSize, is_active: true, company_id: companyId }),
    ),
  list: async (params: {
    page: number;
    page_size: number;
    is_active?: boolean;
    company_id?: string;
  }): Promise<ListResponse<Category[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/material-categories", {
      params: {
        page: params.page,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        is_active: params.is_active,
        roots_only: true,
        company_id: params.company_id,
      },
    });
    return { data: CategoryListSchema.parse(result.data), meta: result.meta };
  },
  create: async (values: CategoryCreateRequest): Promise<Category> =>
    CategorySchema.parse(
      await apiClient.post(
        "/inventory/material-categories",
        CategoryCreateRequestSchema.parse(values),
      ),
    ),
  update: async (id: string, values: CategoryUpdateRequest): Promise<Category> =>
    CategorySchema.parse(
      await apiClient.patch(
        `/inventory/material-categories/${id}`,
        CategoryUpdateRequestSchema.parse(values),
      ),
    ),
};
