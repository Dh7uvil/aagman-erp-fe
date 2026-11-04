import { z } from "zod";

const HexCodeSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || value === "#" || /^#[0-9A-Fa-f]{6}$/.test(value), {
    message: "Enter a valid hex code like #FF5733",
  });

/** Form default when no hex is stored on the record. */
export function hexCodeToFormValue(hex: string | null | undefined): string {
  const trimmed = hex?.trim() ?? "";
  return trimmed || "#";
}

export function hexCodeToApiValue(hex: string): string | null {
  const trimmed = hex.trim();
  if (!trimmed || trimmed === "#") {
    return null;
  }
  return trimmed.toUpperCase();
}

export function hasDisplayHex(hex: string | null | undefined): boolean {
  const trimmed = hex?.trim() ?? "";
  return Boolean(trimmed && trimmed !== "#");
}

export const InkColorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  hex_code: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type InkColor = z.infer<typeof InkColorSchema>;

export const InkColorListSchema = z.array(InkColorSchema);

export const InkColorCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  hex_code: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});
export type InkColorCreateRequest = z.infer<typeof InkColorCreateRequestSchema>;

export const InkColorUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  hex_code: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});
export type InkColorUpdateRequest = z.infer<typeof InkColorUpdateRequestSchema>;

export const InkColorFormSchema = z.object({
  name: z.string().min(1, "Enter color").max(200),
  hex_code: HexCodeSchema,
  is_active: z.boolean(),
});
export type InkColorFormValues = z.infer<typeof InkColorFormSchema>;

export function inkColorToFormValues(color: InkColor | null): InkColorFormValues {
  return {
    name: color?.name ?? "",
    hex_code: hexCodeToFormValue(color?.hex_code),
    is_active: color?.is_active ?? true,
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

export const InkColorUsageLineSchema = z.object({
  ink_line_id: z.string().uuid(),
  ink_sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  brand_id: z.string().uuid(),
  brand_name: z.string(),
  drum_count: DecimalStringSchema,
  drum_qty: DecimalStringSchema,
  drum_unit_code: z.string(),
  total_qty: DecimalStringSchema,
  ink_rate: NullableDecimalStringSchema,
  total_rate: NullableDecimalStringSchema,
  avg_price_per_unit: NullableDecimalStringSchema.optional(),
  price_unit_code: z.string().nullable().optional(),
});

export const InkColorUsageSchema = z.object({
  color: InkColorSchema,
  companies_with_stock: z.number(),
  lines: z.array(InkColorUsageLineSchema),
});
export type InkColorUsage = z.infer<typeof InkColorUsageSchema>;
export type InkColorUsageLine = z.infer<typeof InkColorUsageLineSchema>;

export type InkColorListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
