import { z } from "zod";

const NullableDecimalStringSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) =>
    value === null ? null : typeof value === "number" ? String(value) : value.trim(),
  );

export const MicronSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_name: z.string(),
  name: z.string(),
  price_per_unit: NullableDecimalStringSchema,
  price_unit_id: z.string().uuid().nullable(),
  price_unit_code: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Micron = z.infer<typeof MicronSchema>;

export const MicronListSchema = z.array(MicronSchema);

export const MicronCreateRequestSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price_per_unit: NullableDecimalStringSchema.optional(),
  price_unit_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});
export type MicronCreateRequest = z.infer<typeof MicronCreateRequestSchema>;

export const MicronUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price_per_unit: NullableDecimalStringSchema.optional(),
  price_unit_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
});
export type MicronUpdateRequest = z.infer<typeof MicronUpdateRequestSchema>;

export type MicronListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  product_id?: string;
  is_active?: boolean;
};
