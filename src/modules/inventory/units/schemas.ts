import { z } from "zod";

export const UnitSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Unit = z.infer<typeof UnitSchema>;

export const UnitListSchema = z.array(UnitSchema);

export const UnitCreateRequestSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  is_active: z.boolean().optional(),
});
export type UnitCreateRequest = z.infer<typeof UnitCreateRequestSchema>;

export const UnitUpdateRequestSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
});
export type UnitUpdateRequest = z.infer<typeof UnitUpdateRequestSchema>;

export const UnitFormSchema = z.object({
  code: z.string().min(1, "Enter a code").max(50),
  name: z.string().min(1, "Enter a name").max(200),
  is_active: z.boolean(),
});
export type UnitFormValues = z.infer<typeof UnitFormSchema>;

export function unitToFormValues(unit: Unit | null): UnitFormValues {
  return {
    code: unit?.code ?? "",
    name: unit?.name ?? "",
    is_active: unit?.is_active ?? true,
  };
}

export type UnitListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
