import { z } from "zod";

const DecimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? String(value) : value.trim()));

const NullableDecimalStringSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) =>
    value === null ? null : typeof value === "number" ? String(value) : value.trim(),
  );

export const InkDayReportRowSchema = z.object({
  ink_line_id: z.string().uuid(),
  ink_sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  brand_id: z.string().uuid(),
  brand_name: z.string(),
  color_id: z.string().uuid(),
  color_name: z.string(),
  hex_code: z.string().nullable(),
  drum_unit_code: z.string(),
  in_drums: DecimalStringSchema,
  in_qty: DecimalStringSchema,
  out_drums: DecimalStringSchema,
  out_qty: DecimalStringSchema,
  closing_drums: DecimalStringSchema,
  closing_qty: DecimalStringSchema,
  ink_rate: NullableDecimalStringSchema,
});
export type InkDayReportRow = z.infer<typeof InkDayReportRowSchema>;

export const InkDayReportSchema = z.array(InkDayReportRowSchema);
