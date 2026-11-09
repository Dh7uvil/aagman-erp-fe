import { z } from "zod";

export const SolventNameSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SolventName = z.infer<typeof SolventNameSchema>;

export const SolventNameListSchema = z.array(SolventNameSchema);

export const SolventNameCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  is_active: z.boolean().optional(),
});
export type SolventNameCreateRequest = z.infer<typeof SolventNameCreateRequestSchema>;

export const SolventNameUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
});
export type SolventNameUpdateRequest = z.infer<typeof SolventNameUpdateRequestSchema>;

export const SolventNameFormSchema = z.object({
  name: z.string().min(1, "Enter name").max(200),
  is_active: z.boolean(),
});
export type SolventNameFormValues = z.infer<typeof SolventNameFormSchema>;

export function solventNameToFormValues(name: SolventName | null): SolventNameFormValues {
  return {
    name: name?.name ?? "",
    is_active: name?.is_active ?? true,
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

export const SolventNameUsageLineSchema = z.object({
  solvent_line_id: z.string().uuid(),
  solvent_sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  brand_id: z.string().uuid(),
  brand_name: z.string(),
  drum_count: DecimalStringSchema,
  drum_qty: DecimalStringSchema,
  drum_unit_code: z.string(),
  total_qty: DecimalStringSchema,
  solvent_rate: NullableDecimalStringSchema,
  total_rate: NullableDecimalStringSchema,
  avg_price_per_unit: NullableDecimalStringSchema.optional(),
  price_unit_code: z.string().nullable().optional(),
});

export const SolventNameUsageSchema = z.object({
  solvent_name: SolventNameSchema,
  companies_with_stock: z.number(),
  lines: z.array(SolventNameUsageLineSchema),
});
export type SolventNameUsage = z.infer<typeof SolventNameUsageSchema>;
export type SolventNameUsageLine = z.infer<typeof SolventNameUsageLineSchema>;

export type SolventNameListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
  include_column_totals?: boolean;
};
