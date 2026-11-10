import { z } from "zod";

const DecimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? String(value) : value.trim()));

const NullableDecimalStringSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) =>
    value === null ? null : typeof value === "number" ? String(value) : value.trim(),
  );

export const DayReportRowSchema = z.object({
  category_id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_name: z.string(),
  micron_id: z.string().uuid(),
  micron_name: z.string(),
  size: DecimalStringSchema,
  size_unit_code: z.string(),
  size_label: z.string(),
  category_name: z.string(),
  parent_name: z.string(),
  unit_code: z.string(),
  in_rolls: DecimalStringSchema,
  in_kg: DecimalStringSchema,
  out_rolls: DecimalStringSchema,
  out_kg: DecimalStringSchema,
  closing_rolls: DecimalStringSchema,
  closing_kg: DecimalStringSchema,
  price_per_unit: NullableDecimalStringSchema,
  price_unit_code: z.string().nullable(),
  avg_price_per_unit: NullableDecimalStringSchema.optional(),
});
export type DayReportRow = z.infer<typeof DayReportRowSchema>;

export const DayReportSchema = z.array(DayReportRowSchema);

export const MovementDirectionSchema = z.enum(["IN", "OUT"]);

export const MovementCreateRequestSchema = z.object({
  category_id: z.string().uuid(),
  movement_date: z.string().min(1),
  direction: MovementDirectionSchema,
  rolls: z.string(),
  kilograms: z.string(),
  note: z.string().max(2000).nullable().optional(),
  price_per_unit: z.string().nullable().optional(),
  price_unit_id: z.string().uuid().nullable().optional(),
});
export type MovementCreateRequest = z.infer<typeof MovementCreateRequestSchema>;
