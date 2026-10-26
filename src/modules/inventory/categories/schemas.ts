import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CategoryListSchema = z.array(CategorySchema);

export const CategoryCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  is_active: z.boolean().optional(),
});
export type CategoryCreateRequest = z.infer<typeof CategoryCreateRequestSchema>;

export const CategoryUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
});
export type CategoryUpdateRequest = z.infer<typeof CategoryUpdateRequestSchema>;

export const CategoryFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(200),
  is_active: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

export function categoryToFormValues(category: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? "",
    is_active: category?.is_active ?? true,
  };
}

export type CategoryListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
  roots_only?: boolean;
};
