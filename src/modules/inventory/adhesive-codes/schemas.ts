import { z } from "zod";

export const AdhesiveCodeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AdhesiveCode = z.infer<typeof AdhesiveCodeSchema>;

export const AdhesiveCodeListSchema = z.array(AdhesiveCodeSchema);

export const AdhesiveCodeCreateRequestSchema = z.object({
  code: z.string().min(1).max(200),
  is_active: z.boolean().optional(),
});
export type AdhesiveCodeCreateRequest = z.infer<typeof AdhesiveCodeCreateRequestSchema>;

export const AdhesiveCodeUpdateRequestSchema = z.object({
  code: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
});
export type AdhesiveCodeUpdateRequest = z.infer<typeof AdhesiveCodeUpdateRequestSchema>;

export const AdhesiveCodeFormSchema = z.object({
  code: z.string().min(1, "Enter code").max(200),
  is_active: z.boolean(),
});
export type AdhesiveCodeFormValues = z.infer<typeof AdhesiveCodeFormSchema>;

export function adhesiveCodeToFormValues(code: AdhesiveCode | null): AdhesiveCodeFormValues {
  return {
    code: code?.code ?? "",
    is_active: code?.is_active ?? true,
  };
}

const DecimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? String(value) : value.trim()));

const NullableDecimalStringSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) =>
    value === null ? null : typeof value === "number" ? String(value) : value.trim(),
  );

export const AdhesiveCodeUsageLineSchema = z.object({
  adhesive_line_id: z.string().uuid(),
  adhesive_sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  brand_id: z.string().uuid(),
  brand_name: z.string(),
  drum_count: DecimalStringSchema,
  drum_qty: DecimalStringSchema,
  drum_unit_code: z.string(),
  total_qty: DecimalStringSchema,
  adhesive_rate: NullableDecimalStringSchema,
  total_rate: NullableDecimalStringSchema,
  avg_price_per_unit: NullableDecimalStringSchema.optional(),
  price_unit_code: z.string().nullable().optional(),
});

export const AdhesiveCodeUsageSchema = z.object({
  adhesive_code: AdhesiveCodeSchema,
  companies_with_stock: z.number(),
  lines: z.array(AdhesiveCodeUsageLineSchema),
});
export type AdhesiveCodeUsage = z.infer<typeof AdhesiveCodeUsageSchema>;
export type AdhesiveCodeUsageLine = z.infer<typeof AdhesiveCodeUsageLineSchema>;

export type AdhesiveCodeListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
