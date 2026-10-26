import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  CategoryCreateRequestSchema,
  CategoryListSchema,
  CategorySchema,
  type Category,
  type CategoryCreateRequest,
} from "@/modules/inventory/categories/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const categoriesApi = {
  listAll: (): Promise<Category[]> =>
    fetchAllPages((page, pageSize) => categoriesApi.list({ page, page_size: pageSize, is_active: true })),
  list: async (params: {
    page: number;
    page_size: number;
    is_active?: boolean;
  }): Promise<ListResponse<Category[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/material-categories", {
      params: {
        page: params.page,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        is_active: params.is_active,
        roots_only: true,
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
};
