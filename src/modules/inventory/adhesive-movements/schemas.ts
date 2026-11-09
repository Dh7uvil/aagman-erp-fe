import { z } from "zod";

const DecimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? String(value) : value.trim()));

const NullableDecimalStringSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) =>
    value === null ? null : typeof value === "number" ? String(value) : value.trim(),
  );

export const AdhesiveDayReportRowSchema = z.object({
  adhesive_line_id: z.string().uuid(),
  adhesive_sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  brand_id: z.string().uuid(),
  brand_name: z.string(),
  adhesive_code_id: z.string().uuid(),
  code: z.string(),
  drum_unit_code: z.string(),
  in_drums: DecimalStringSchema,
  in_qty: DecimalStringSchema,
  out_drums: DecimalStringSchema,
  out_qty: DecimalStringSchema,
  closing_drums: DecimalStringSchema,
  closing_qty: DecimalStringSchema,
  adhesive_rate: NullableDecimalStringSchema,
});
export type AdhesiveDayReportRow = z.infer<typeof AdhesiveDayReportRowSchema>;

export const AdhesiveDayReportSchema = z.array(AdhesiveDayReportRowSchema);
