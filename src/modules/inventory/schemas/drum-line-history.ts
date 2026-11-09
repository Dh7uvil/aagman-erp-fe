import { z } from "zod";

export const DrumLineHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string(),
  kind: z.literal("stock"),
  action: z.string(),
  user: z.object({ id: z.string().uuid(), name: z.string() }).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  company_name: z.string().optional(),
  drums: z.union([z.string(), z.number()]).nullable().optional(),
  quantity: z.union([z.string(), z.number()]).nullable().optional(),
  quantity_unit_code: z.string().nullable().optional(),
  price_per_unit: z.union([z.string(), z.number()]).nullable().optional(),
  price_unit_code: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});
export type DrumLineHistoryEntry = z.infer<typeof DrumLineHistoryEntrySchema>;

export const DrumLineHistorySummarySchema = z.object({
  line_id: z.string().uuid(),
  sheet_id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  brand_name: z.string(),
  line_label: z.string(),
  drums_on_hand: z.union([z.string(), z.number()]),
  total_qty: z.union([z.string(), z.number()]),
  quantity_unit_code: z.string(),
  last_purchase_price: z.union([z.string(), z.number()]).nullable().optional(),
  last_purchase_price_unit_code: z.string().nullable().optional(),
  last_purchase_date: z.string().nullable().optional(),
  last_purchase_drums: z.union([z.string(), z.number()]).nullable().optional(),
  avg_price_per_unit: z.union([z.string(), z.number()]).nullable().optional(),
  price_unit_code: z.string().nullable().optional(),
});
export type DrumLineHistorySummary = z.infer<typeof DrumLineHistorySummarySchema>;
