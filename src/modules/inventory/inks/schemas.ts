import { z } from "zod";

import { isNumericDecimalString } from "@/shared/lib/format";

const DecimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? String(value) : value.trim()));

const NullableDecimalStringSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) =>
    value === null ? null : typeof value === "number" ? String(value) : value.trim(),
  );

export const InkBrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type InkBrand = z.infer<typeof InkBrandSchema>;

export const InkBrandListSchema = z.array(InkBrandSchema);

export const InkBrandCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  is_active: z.boolean().optional(),
});
export type InkBrandCreateRequest = z.infer<typeof InkBrandCreateRequestSchema>;

export const InkFileMetaSchema = z.object({
  filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
});

export const InkLineSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  brand_name: z.string(),
  color_id: z.string().uuid(),
  color_name: z.string(),
  hex_code: z.string().nullable(),
  drum_count: DecimalStringSchema,
  drum_qty: DecimalStringSchema,
  drum_unit_id: z.string().uuid(),
  drum_unit_code: z.string(),
  total_qty: DecimalStringSchema,
  ink_rate: NullableDecimalStringSchema,
  total_rate: NullableDecimalStringSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type InkLine = z.infer<typeof InkLineSchema>;

export const InkSheetListItemSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  line_count: z.number(),
  total_drums: DecimalStringSchema,
  total_qty: DecimalStringSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type InkSheetListItem = z.infer<typeof InkSheetListItemSchema>;

export const InkLineListItemSchema = InkLineSchema.extend({
  ink_sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
});
export type InkLineListItem = z.infer<typeof InkLineListItemSchema>;

export const InkSheetListSchema = z.array(InkLineListItemSchema);

export const InkSheetSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  lines: z.array(InkLineSchema),
  product_image: InkFileMetaSchema.nullable().optional(),
  ink_image: InkFileMetaSchema.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type InkSheet = z.infer<typeof InkSheetSchema>;

export const InkLineUpsertSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  brand_id: z.string().uuid(),
  color_id: z.string().uuid(),
  drum_count: z.string(),
  drum_qty: z.string(),
  drum_unit_id: z.string().uuid().nullable().optional(),
  ink_rate: z.string().nullable().optional(),
});
export type InkLineUpsert = z.infer<typeof InkLineUpsertSchema>;

export const InkSheetCreateRequestSchema = z.object({
  company_id: z.string().uuid(),
  lines: z.array(InkLineUpsertSchema),
});
export type InkSheetCreateRequest = z.infer<typeof InkSheetCreateRequestSchema>;

export const InkSheetUpdateRequestSchema = z.object({
  lines: z.array(InkLineUpsertSchema).optional(),
});
export type InkSheetUpdateRequest = z.infer<typeof InkSheetUpdateRequestSchema>;

export const InkStockOutRequestSchema = z.object({
  ink_line_id: z.string().uuid(),
  movement_date: z.string().nullable().optional(),
  drums: z.string(),
  quantity: z.string(),
  note: z.string().max(2000).nullable().optional(),
});
export type InkStockOutRequest = z.infer<typeof InkStockOutRequestSchema>;

export type InkListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  company_id?: string;
};

export type InkBrandListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};

export const InkLineFormSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.string().uuid({ message: "Select a brand" }),
  color_id: z.string().uuid({ message: "Select a color" }),
  hex_code: z.string(),
  drum_count: z.string(),
  drum_qty: z.string(),
  drum_unit_id: z.string().uuid({ message: "Select a unit" }),
  ink_rate: z.string(),
});

export const InkFormSchema = z.object({
  company_id: z.string().uuid({ message: "Select a company" }),
  lines: z.array(InkLineFormSchema).min(1, "Add at least one ink line"),
});
export type InkFormValues = z.infer<typeof InkFormSchema>;
export type InkLineFormValues = z.infer<typeof InkLineFormSchema>;

export function emptyInkLine(defaultUnitId: string): InkLineFormValues {
  return {
    brand_id: "",
    color_id: "",
    hex_code: "",
    drum_count: "0",
    drum_qty: "0",
    drum_unit_id: defaultUnitId,
    ink_rate: "",
  };
}

export function inkLineToFormValues(line: InkLine): InkLineFormValues {
  return {
    id: line.id,
    brand_id: line.brand_id,
    color_id: line.color_id,
    hex_code: line.hex_code ?? "",
    drum_count: line.drum_count,
    drum_qty: line.drum_qty,
    drum_unit_id: line.drum_unit_id,
    ink_rate: line.ink_rate ?? "",
  };
}

export function inkSheetToFormValues(sheet: InkSheet | null, defaultUnitId: string): InkFormValues {
  if (!sheet) {
    return { company_id: "", lines: [emptyInkLine(defaultUnitId)] };
  }
  return {
    company_id: sheet.company_id,
    lines:
      sheet.lines.length > 0
        ? sheet.lines.map(inkLineToFormValues)
        : [emptyInkLine(defaultUnitId)],
  };
}

export function computeInkLineTotals(
  drumCount: string,
  drumQty: string,
  inkRate: string,
): { totalQty: number; totalRate: number | null } {
  const drums = Number(drumCount.trim() || "0");
  const perDrum = Number(drumQty.trim() || "0");
  const totalQty = Number.isFinite(drums) && Number.isFinite(perDrum) ? drums * perDrum : 0;
  const rateTrim = inkRate.trim();
  const rate = rateTrim && isNumericDecimalString(rateTrim) ? Number(rateTrim) : null;
  const totalRate = rate != null && Number.isFinite(totalQty) ? totalQty * rate : null;
  return { totalQty, totalRate };
}

export function inkLineFormToUpsert(line: InkLineFormValues, includePrice: boolean): InkLineUpsert {
  const payload: InkLineUpsert = {
    id: line.id ?? null,
    brand_id: line.brand_id,
    color_id: line.color_id,
    drum_count: line.drum_count.trim() || "0",
    drum_qty: line.drum_qty.trim() || "0",
    drum_unit_id: line.drum_unit_id || null,
  };
  if (includePrice) {
    const rate = line.ink_rate.trim();
    payload.ink_rate = rate === "" ? null : rate;
  }
  return payload;
}

export function inkFormToCreatePayload(values: InkFormValues, includePrice: boolean): InkSheetCreateRequest {
  return {
    company_id: values.company_id,
    lines: values.lines.map((line) => inkLineFormToUpsert(line, includePrice)),
  };
}

export function inkFormToUpdatePayload(values: InkFormValues, includePrice: boolean): InkSheetUpdateRequest {
  return {
    lines: values.lines.map((line) => inkLineFormToUpsert(line, includePrice)),
  };
}
