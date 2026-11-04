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

export const AdhesiveBrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AdhesiveBrand = z.infer<typeof AdhesiveBrandSchema>;

export const AdhesiveBrandListSchema = z.array(AdhesiveBrandSchema);

export const AdhesiveBrandCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  is_active: z.boolean().optional(),
});
export type AdhesiveBrandCreateRequest = z.infer<typeof AdhesiveBrandCreateRequestSchema>;

export const AdhesiveBrandUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
});
export type AdhesiveBrandUpdateRequest = z.infer<typeof AdhesiveBrandUpdateRequestSchema>;

export const AdhesiveBrandFormSchema = z.object({
  name: z.string().min(1, "Enter brand name").max(200),
  is_active: z.boolean(),
});
export type AdhesiveBrandFormValues = z.infer<typeof AdhesiveBrandFormSchema>;

export function adhesiveBrandToFormValues(brand: AdhesiveBrand | null): AdhesiveBrandFormValues {
  return {
    name: brand?.name ?? "",
    is_active: brand?.is_active ?? true,
  };
}

export const AdhesiveLineSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  brand_name: z.string(),
  adhesive_code_id: z.string().uuid(),
  code: z.string(),
  drum_count: DecimalStringSchema,
  drum_qty: DecimalStringSchema,
  drum_unit_id: z.string().uuid(),
  drum_unit_code: z.string(),
  total_qty: DecimalStringSchema,
  adhesive_rate: NullableDecimalStringSchema,
  total_rate: NullableDecimalStringSchema,
  avg_price_per_unit: NullableDecimalStringSchema.optional(),
  price_unit_code: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AdhesiveLine = z.infer<typeof AdhesiveLineSchema>;

export const AdhesiveSheetListItemSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  line_count: z.number(),
  total_drums: DecimalStringSchema,
  total_qty: DecimalStringSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type AdhesiveSheetListItem = z.infer<typeof AdhesiveSheetListItemSchema>;

export const AdhesiveLineListItemSchema = AdhesiveLineSchema.extend({
  adhesive_sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
});
export type AdhesiveLineListItem = z.infer<typeof AdhesiveLineListItemSchema>;

export const AdhesiveSheetListSchema = z.array(AdhesiveLineListItemSchema);

export const AdhesiveSheetSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  lines: z.array(AdhesiveLineSchema),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AdhesiveSheet = z.infer<typeof AdhesiveSheetSchema>;

export const AdhesiveLineUpsertSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  brand_id: z.string().uuid(),
  adhesive_code_id: z.string().uuid(),
  drum_count: z.string(),
  drum_qty: z.string(),
  drum_unit_id: z.string().uuid().nullable().optional(),
  adhesive_rate: z.string().nullable().optional(),
});
export type AdhesiveLineUpsert = z.infer<typeof AdhesiveLineUpsertSchema>;

export const AdhesiveSheetCreateRequestSchema = z.object({
  company_id: z.string().uuid(),
  lines: z.array(AdhesiveLineUpsertSchema),
});
export type AdhesiveSheetCreateRequest = z.infer<typeof AdhesiveSheetCreateRequestSchema>;

export const AdhesiveSheetUpdateRequestSchema = z.object({
  lines: z.array(AdhesiveLineUpsertSchema).optional(),
});
export type AdhesiveSheetUpdateRequest = z.infer<typeof AdhesiveSheetUpdateRequestSchema>;

export const AdhesiveStockOutRequestSchema = z.object({
  adhesive_line_id: z.string().uuid(),
  movement_date: z.string().nullable().optional(),
  drums: z.string(),
  quantity: z.string(),
  note: z.string().max(2000).nullable().optional(),
});
export type AdhesiveStockOutRequest = z.infer<typeof AdhesiveStockOutRequestSchema>;

export type AdhesiveListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  company_id?: string;
};

export type AdhesiveBrandListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};

export const AdhesiveLineFormSchema = z.object({
  line_id: z.string().uuid().optional(),
  brand_id: z.string().uuid({ message: "Select a brand" }),
  adhesive_code_id: z.string().uuid({ message: "Select a code" }),
  drum_count: z.string(),
  drum_qty: z.string(),
  drum_unit_id: z.string().uuid({ message: "Select a unit" }),
  adhesive_rate: z.string(),
  avg_price_per_unit: z.string().optional(),
  price_unit_code: z.string().optional(),
});

export const AdhesiveFormSchema = z.object({
  company_id: z.string().uuid({ message: "Select a company" }),
  lines: z.array(AdhesiveLineFormSchema).min(1, "Add at least one adhesive line"),
});
export type AdhesiveFormValues = z.infer<typeof AdhesiveFormSchema>;
export type AdhesiveLineFormValues = z.infer<typeof AdhesiveLineFormSchema>;

export function emptyAdhesiveLine(defaultUnitId: string): AdhesiveLineFormValues {
  return {
    brand_id: "",
    adhesive_code_id: "",
    drum_count: "0",
    drum_qty: "0",
    drum_unit_id: defaultUnitId,
    adhesive_rate: "",
    avg_price_per_unit: "",
    price_unit_code: "",
  };
}

export function adhesiveLineToFormValues(line: AdhesiveLine): AdhesiveLineFormValues {
  return {
    line_id: line.id,
    brand_id: line.brand_id,
    adhesive_code_id: line.adhesive_code_id,
    drum_count: line.drum_count,
    drum_qty: line.drum_qty,
    drum_unit_id: line.drum_unit_id,
    adhesive_rate: line.adhesive_rate ?? "",
    avg_price_per_unit: line.avg_price_per_unit ?? "",
    price_unit_code: line.price_unit_code ?? "",
  };
}

/** Stable key for syncing the sheet form after save/refetch (line count + line identity). */
export function adhesiveSheetFormRevision(sheet: AdhesiveSheet): string {
  return `${sheet.updated_at}|${sheet.lines
    .map((line) => `${line.id}:${line.brand_id}:${line.adhesive_code_id}`)
    .join(",")}`;
}

export function adhesiveSheetToFormValues(
  sheet: AdhesiveSheet | null,
  defaultUnitId: string,
): AdhesiveFormValues {
  if (!sheet) {
    return { company_id: "", lines: [emptyAdhesiveLine(defaultUnitId)] };
  }
  return {
    company_id: sheet.company_id,
    lines:
      sheet.lines.length > 0
        ? sheet.lines.map(adhesiveLineToFormValues)
        : [emptyAdhesiveLine(defaultUnitId)],
  };
}

export function computeAdhesiveLineTotals(
  drumCount: string,
  drumQty: string,
  adhesiveRate: string,
): { totalQty: number; totalRate: number | null } {
  const drums = Number(drumCount.trim() || "0");
  const perDrum = Number(drumQty.trim() || "0");
  const totalQty = Number.isFinite(drums) && Number.isFinite(perDrum) ? drums * perDrum : 0;
  const rateTrim = adhesiveRate.trim();
  const rate = rateTrim && isNumericDecimalString(rateTrim) ? Number(rateTrim) : null;
  const totalRate = rate != null && Number.isFinite(totalQty) ? totalQty * rate : null;
  return { totalQty, totalRate };
}

export function adhesiveLineFormToUpsert(
  line: AdhesiveLineFormValues,
  includePrice: boolean,
): AdhesiveLineUpsert {
  const payload: AdhesiveLineUpsert = {
    id: line.line_id ?? null,
    brand_id: line.brand_id,
    adhesive_code_id: line.adhesive_code_id,
    drum_count: line.drum_count.trim() || "0",
    drum_qty: line.drum_qty.trim() || "0",
    drum_unit_id: line.drum_unit_id || null,
  };
  if (includePrice) {
    const rate = line.adhesive_rate.trim();
    payload.adhesive_rate = rate === "" ? null : rate;
  }
  return payload;
}

export function adhesiveLineRecordToUpsert(line: AdhesiveLine, includePrice: boolean): AdhesiveLineUpsert {
  const payload: AdhesiveLineUpsert = {
    id: line.id,
    brand_id: line.brand_id,
    adhesive_code_id: line.adhesive_code_id,
    drum_count: line.drum_count,
    drum_qty: line.drum_qty,
    drum_unit_id: line.drum_unit_id,
  };
  if (includePrice) {
    payload.adhesive_rate = line.adhesive_rate;
  }
  return payload;
}

export function adhesiveFormToCreatePayload(
  values: AdhesiveFormValues,
  includePrice: boolean,
): AdhesiveSheetCreateRequest {
  return {
    company_id: values.company_id,
    lines: values.lines.map((line) => adhesiveLineFormToUpsert(line, includePrice)),
  };
}

export function adhesiveFormToUpdatePayload(
  values: AdhesiveFormValues,
  includePrice: boolean,
): AdhesiveSheetUpdateRequest {
  return {
    lines: values.lines.map((line) => adhesiveLineFormToUpsert(line, includePrice)),
  };
}
