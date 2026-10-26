import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  MicronCreateRequestSchema,
  MicronListSchema,
  MicronSchema,
  MicronUpdateRequestSchema,
  type Micron,
  type MicronCreateRequest,
  type MicronListParams,
  type MicronUpdateRequest,
} from "@/modules/inventory/microns/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const micronsApi = {
  list: async (params: MicronListParams = {}): Promise<ListResponse<Micron[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/microns", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        product_id: params.product_id,
        is_active: params.is_active,
      },
    });
    return { data: MicronListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (params: Pick<MicronListParams, "is_active" | "product_id"> = {}): Promise<Micron[]> =>
    fetchAllPages((page, pageSize) =>
      micronsApi.list({ page, page_size: pageSize, is_active: params.is_active, product_id: params.product_id }),
    ),
  create: async (values: MicronCreateRequest): Promise<Micron> =>
    MicronSchema.parse(
      await apiClient.post("/inventory/microns", MicronCreateRequestSchema.parse(values)),
    ),
  update: async (id: string, values: MicronUpdateRequest): Promise<Micron> =>
    MicronSchema.parse(
      await apiClient.patch(
        `/inventory/microns/${id}`,
        MicronUpdateRequestSchema.parse(values),
      ),
    ),
};
