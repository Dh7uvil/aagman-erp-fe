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

export const SolventBrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SolventBrand = z.infer<typeof SolventBrandSchema>;

export const SolventBrandListSchema = z.array(SolventBrandSchema);

export const SolventBrandCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  is_active: z.boolean().optional(),
});
export type SolventBrandCreateRequest = z.infer<typeof SolventBrandCreateRequestSchema>;

export const SolventBrandUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  is_active: z.boolean().optional(),
});
export type SolventBrandUpdateRequest = z.infer<typeof SolventBrandUpdateRequestSchema>;

export const SolventBrandFormSchema = z.object({
  name: z.string().min(1, "Enter brand name").max(200),
  is_active: z.boolean(),
});
export type SolventBrandFormValues = z.infer<typeof SolventBrandFormSchema>;

export function solventBrandToFormValues(brand: SolventBrand | null): SolventBrandFormValues {
  return {
    name: brand?.name ?? "",
    is_active: brand?.is_active ?? true,
  };
}

export const SolventLineSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  brand_name: z.string(),
  solvent_name_id: z.string().uuid(),
  name: z.string(),
  drum_count: DecimalStringSchema,
  drum_qty: DecimalStringSchema,
  drum_unit_id: z.string().uuid(),
  drum_unit_code: z.string(),
  total_qty: DecimalStringSchema,
  solvent_rate: NullableDecimalStringSchema,
  total_rate: NullableDecimalStringSchema,
  avg_price_per_unit: NullableDecimalStringSchema.optional(),
  price_unit_code: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SolventLine = z.infer<typeof SolventLineSchema>;

export const SolventSheetListItemSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  line_count: z.number(),
  total_drums: DecimalStringSchema,
  total_qty: DecimalStringSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type SolventSheetListItem = z.infer<typeof SolventSheetListItemSchema>;

export const SolventLineListItemSchema = SolventLineSchema.extend({
  solvent_sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
});
export type SolventLineListItem = z.infer<typeof SolventLineListItemSchema>;

export const SolventSheetListSchema = z.array(SolventLineListItemSchema);

export const SolventSheetSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  lines: z.array(SolventLineSchema),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SolventSheet = z.infer<typeof SolventSheetSchema>;

export const SolventLineUpsertSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  brand_id: z.string().uuid(),
  solvent_name_id: z.string().uuid(),
  drum_count: z.string(),
  drum_qty: z.string(),
  drum_unit_id: z.string().uuid().nullable().optional(),
  solvent_rate: z.string().nullable().optional(),
});
export type SolventLineUpsert = z.infer<typeof SolventLineUpsertSchema>;

export const SolventSheetCreateRequestSchema = z.object({
  company_id: z.string().uuid(),
  lines: z.array(SolventLineUpsertSchema),
});
export type SolventSheetCreateRequest = z.infer<typeof SolventSheetCreateRequestSchema>;

export const SolventSheetUpdateRequestSchema = z.object({
  lines: z.array(SolventLineUpsertSchema).optional(),
});
export type SolventSheetUpdateRequest = z.infer<typeof SolventSheetUpdateRequestSchema>;

export const SolventStockOutRequestSchema = z.object({
  solvent_line_id: z.string().uuid(),
  movement_date: z.string().nullable().optional(),
  drums: z.string(),
  quantity: z.string(),
  note: z.string().max(2000).nullable().optional(),
});
export type SolventStockOutRequest = z.infer<typeof SolventStockOutRequestSchema>;

export type SolventListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  company_id?: string;
};

export type SolventBrandListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};

export const SolventLineFormSchema = z.object({
  line_id: z.string().uuid().optional(),
  brand_id: z.string().uuid({ message: "Select a brand" }),
  solvent_name_id: z.string().uuid({ message: "Select a code" }),
  drum_count: z.string(),
  drum_qty: z.string(),
  drum_unit_id: z.string().uuid({ message: "Select a unit" }),
  solvent_rate: z.string(),
  avg_price_per_unit: z.string().optional(),
  price_unit_code: z.string().optional(),
});

export const SolventFormSchema = z.object({
  company_id: z.string().uuid({ message: "Select a company" }),
  lines: z.array(SolventLineFormSchema).min(1, "Add at least one solvent line"),
});
export type SolventFormValues = z.infer<typeof SolventFormSchema>;
export type SolventLineFormValues = z.infer<typeof SolventLineFormSchema>;

export function emptySolventLine(defaultUnitId: string): SolventLineFormValues {
  return {
    brand_id: "",
    solvent_name_id: "",
    drum_count: "0",
    drum_qty: "0",
    drum_unit_id: defaultUnitId,
    solvent_rate: "",
    avg_price_per_unit: "",
    price_unit_code: "",
  };
}

export function solventLineToFormValues(line: SolventLine): SolventLineFormValues {
  return {
    line_id: line.id,
    brand_id: line.brand_id,
    solvent_name_id: line.solvent_name_id,
    drum_count: line.drum_count,
    drum_qty: line.drum_qty,
    drum_unit_id: line.drum_unit_id,
    solvent_rate: line.solvent_rate ?? "",
    avg_price_per_unit: line.avg_price_per_unit ?? "",
    price_unit_code: line.price_unit_code ?? "",
  };
}

/** Stable key for syncing the sheet form after save/refetch (line count + line identity). */
export function solventSheetFormRevision(sheet: SolventSheet): string {
  return `${sheet.updated_at}|${sheet.lines
    .map((line) => `${line.id}:${line.brand_id}:${line.solvent_name_id}`)
    .join(",")}`;
}

export function solventSheetToFormValues(
  sheet: SolventSheet | null,
  defaultUnitId: string,
): SolventFormValues {
  if (!sheet) {
    return { company_id: "", lines: [emptySolventLine(defaultUnitId)] };
  }
  return {
    company_id: sheet.company_id,
    lines:
      sheet.lines.length > 0
        ? sheet.lines.map(solventLineToFormValues)
        : [emptySolventLine(defaultUnitId)],
  };
}

export function computeSolventLineTotals(
  drumCount: string,
  drumQty: string,
  solventRate: string,
): { totalQty: number; totalRate: number | null } {
  const drums = Number(drumCount.trim() || "0");
  const perDrum = Number(drumQty.trim() || "0");
  const totalQty = Number.isFinite(drums) && Number.isFinite(perDrum) ? drums * perDrum : 0;
  const rateTrim = solventRate.trim();
  const rate = rateTrim && isNumericDecimalString(rateTrim) ? Number(rateTrim) : null;
  const totalRate = rate != null && Number.isFinite(totalQty) ? totalQty * rate : null;
  return { totalQty, totalRate };
}

export function solventLineFormToUpsert(
  line: SolventLineFormValues,
  includePrice: boolean,
): SolventLineUpsert {
  const payload: SolventLineUpsert = {
    id: line.line_id ?? null,
    brand_id: line.brand_id,
    solvent_name_id: line.solvent_name_id,
    drum_count: line.drum_count.trim() || "0",
    drum_qty: line.drum_qty.trim() || "0",
    drum_unit_id: line.drum_unit_id || null,
  };
  if (includePrice) {
    const rate = line.solvent_rate.trim();
    payload.solvent_rate = rate === "" ? null : rate;
  }
  return payload;
}

export function solventLineRecordToUpsert(line: SolventLine, includePrice: boolean): SolventLineUpsert {
  const payload: SolventLineUpsert = {
    id: line.id,
    brand_id: line.brand_id,
    solvent_name_id: line.solvent_name_id,
    drum_count: line.drum_count,
    drum_qty: line.drum_qty,
    drum_unit_id: line.drum_unit_id,
  };
  if (includePrice) {
    payload.solvent_rate = line.solvent_rate;
  }
  return payload;
}

export function solventFormToCreatePayload(
  values: SolventFormValues,
  includePrice: boolean,
): SolventSheetCreateRequest {
  return {
    company_id: values.company_id,
    lines: values.lines.map((line) => solventLineFormToUpsert(line, includePrice)),
  };
}

export function solventFormToUpdatePayload(
  values: SolventFormValues,
  includePrice: boolean,
): SolventSheetUpdateRequest {
  return {
    lines: values.lines.map((line) => solventLineFormToUpsert(line, includePrice)),
  };
}
