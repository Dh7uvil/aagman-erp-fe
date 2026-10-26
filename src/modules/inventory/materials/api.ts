import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  MaterialCreateRequestSchema,
  MaterialListSchema,
  MaterialSchema,
  MaterialUpdateRequestSchema,
  type Material,
  type MaterialCreateRequest,
  type MaterialFormValues,
  type MaterialListParams,
  type MaterialSizeLineValues,
  type MaterialUpdateRequest,
} from "@/modules/inventory/materials/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";
import { fetchAllPages } from "@/shared/api/paginate";

export const materialsApi = {
  list: async (params: MaterialListParams = {}): Promise<ListResponse<Material[]>> => {
    const result = await apiClient.getList<unknown>("/inventory/material-subcategories", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        parent_id: params.parent_id,
        product_id: params.product_id,
        is_active: params.is_active,
        size: params.size,
        rolls: params.rolls,
        kg_lt: params.kg_lt,
        kg_gt: params.kg_gt,
      },
    });
    return { data: MaterialListSchema.parse(result.data), meta: result.meta };
  },
  listAll: (
    params: Pick<MaterialListParams, "is_active" | "parent_id" | "product_id"> = {},
  ): Promise<Material[]> =>
    fetchAllPages((page, pageSize) =>
      materialsApi.list({ page, page_size: pageSize, ...params }),
    ),
  get: async (id: string): Promise<Material> =>
    MaterialSchema.parse(await apiClient.get(`/inventory/material-subcategories/${id}`)),
  create: async (values: MaterialCreateRequest): Promise<Material> =>
    MaterialSchema.parse(
      await apiClient.post(
        "/inventory/material-subcategories",
        MaterialCreateRequestSchema.parse(values),
      ),
    ),
  update: async (id: string, values: MaterialUpdateRequest): Promise<Material> =>
    MaterialSchema.parse(
      await apiClient.patch(
        `/inventory/material-subcategories/${id}`,
        MaterialUpdateRequestSchema.parse(values),
      ),
    ),
  delete: async (id: string): Promise<Material> =>
    MaterialSchema.parse(await apiClient.delete(`/inventory/material-subcategories/${id}`)),
};

function stockQuantity(value: string): string {
  return value.trim() || "0";
}

export function toCreatePayload(values: MaterialFormValues): MaterialCreateRequest {
  return {
    parent_id: values.parent_id,
    size: values.size.trim(),
    size_unit_id: values.size_unit_id,
    unit_id: values.unit_id,
    opening_rolls: stockQuantity(values.opening_rolls),
    opening_kg: stockQuantity(values.quantity_available),
    is_active: values.is_active,
  };
}

export function sizeLineToCreatePayload(
  parentId: string,
  line: MaterialSizeLineValues,
): MaterialCreateRequest {
  return {
    parent_id: parentId,
    size: line.size.trim(),
    size_unit_id: line.size_unit_id,
    unit_id: line.unit_id,
    opening_rolls: stockQuantity(line.opening_rolls),
    opening_kg: stockQuantity(line.quantity_available),
    is_active: line.is_active,
  };
}

export function toUpdatePayload(values: MaterialFormValues): MaterialUpdateRequest {
  return {
    parent_id: values.parent_id,
    size: values.size.trim(),
    size_unit_id: values.size_unit_id,
    unit_id: values.unit_id,
    rolls_on_hand: stockQuantity(values.opening_rolls),
    total_kg: stockQuantity(values.quantity_available),
    is_active: values.is_active,
  };
}

export function sizeLineToUpdatePayload(line: MaterialSizeLineValues): MaterialUpdateRequest {
  return {
    size: line.size.trim(),
    size_unit_id: line.size_unit_id,
    unit_id: line.unit_id,
    rolls_on_hand: stockQuantity(line.opening_rolls),
    total_kg: stockQuantity(line.quantity_available),
    is_active: line.is_active,
  };
}

export function toMicronPricePayload(values: MaterialFormValues): {
  price_per_unit: string | null;
  price_unit_id: string;
} | null {
  const priceUnitId = values.price_unit_id.trim();
  if (!priceUnitId) {
    return null;
  }
  const price = values.price_per_unit.trim();
  return {
    price_per_unit: price === "" ? null : price,
    price_unit_id: priceUnitId,
  };
}
