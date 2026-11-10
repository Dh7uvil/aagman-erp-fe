import { z } from "zod";

const DecimalStringSchema = z.union([z.string(), z.number()]).transform(String);

export const DashboardRangeParamsSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export type DashboardRangeParams = z.infer<typeof DashboardRangeParamsSchema>;

export const CylinderStatusCountSchema = z.object({
  status: z.string(),
  count: z.number(),
});

export const CylinderActivityBucketSchema = z.object({
  bucket_start: z.string(),
  cylinders_created: z.number(),
  returns_created: z.number(),
});

export const TopCompanyCylindersSchema = z.object({
  company_id: z.string(),
  company_name: z.string(),
  active_cylinders: z.number(),
  cylinder_count: z.number(),
});

export const OpenCylinderPauseSchema = z.object({
  cylinder_id: z.string(),
  cylinder_number: z.string(),
  company_name: z.string(),
  paused_at: z.string(),
  days_paused: z.number(),
});

export const CylindersDashboardKpisSchema = z.object({
  active_cylinders: z.number(),
  paused_cylinders: z.number(),
  cylinders_in_circulation: z.number(),
  awaiting_return: z.number(),
  cylinder_cost_exposure: DecimalStringSchema.nullable(),
});

export const CylindersDashboardSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
  kpis: CylindersDashboardKpisSchema,
  status_breakdown: z.array(CylinderStatusCountSchema),
  activity_buckets: z.array(CylinderActivityBucketSchema),
  top_companies: z.array(TopCompanyCylindersSchema),
  open_pauses: z.array(OpenCylinderPauseSchema),
});

export type CylindersDashboard = z.infer<typeof CylindersDashboardSchema>;

export const MovementActivityBucketSchema = z.object({
  bucket_start: z.string(),
  in_kg: DecimalStringSchema,
  out_kg: DecimalStringSchema,
});

export const StockByProductSchema = z.object({
  product_name: z.string(),
  total_kg: DecimalStringSchema,
});

export const ReorderWatchItemSchema = z.object({
  material_id: z.string(),
  name: z.string(),
  total_kg: DecimalStringSchema,
  avg_daily_out_kg: DecimalStringSchema,
  days_of_cover: DecimalStringSchema,
});

export const TopConsumedSkuSchema = z.object({
  material_id: z.string(),
  name: z.string(),
  out_kg: DecimalStringSchema,
});

export const DeadStockItemSchema = z.object({
  material_id: z.string(),
  name: z.string(),
  total_kg: DecimalStringSchema,
  days_idle: z.number(),
  last_activity_date: z.string(),
});

export const MaterialsDashboardKpisSchema = z.object({
  active_skus: z.number(),
  total_kg_on_hand: DecimalStringSchema,
  out_of_stock_skus: z.number(),
  stock_value: DecimalStringSchema.nullable(),
  valued_sku_count: z.number(),
  dead_stock_skus: z.number(),
});

export const MaterialsDashboardSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
  kpis: MaterialsDashboardKpisSchema,
  movement_buckets: z.array(MovementActivityBucketSchema),
  stock_by_product: z.array(StockByProductSchema),
  reorder_watchlist: z.array(ReorderWatchItemSchema),
  top_consumed: z.array(TopConsumedSkuSchema),
  dead_stock: z.array(DeadStockItemSchema),
});

export type MaterialsDashboard = z.infer<typeof MaterialsDashboardSchema>;

export const StockByCompanySchema = z.object({
  company_name: z.string(),
  total_qty: DecimalStringSchema,
});

export const TopConsumedInkLineSchema = z.object({
  ink_line_id: z.string(),
  name: z.string(),
  out_qty: DecimalStringSchema,
});

export const InkDeadStockItemSchema = z.object({
  ink_line_id: z.string(),
  name: z.string(),
  total_qty: DecimalStringSchema,
  days_idle: z.number(),
  last_activity_date: z.string(),
});

export const InksDashboardKpisSchema = z.object({
  active_lines: z.number(),
  total_qty_on_hand: DecimalStringSchema,
  out_of_stock_lines: z.number(),
  stock_value: DecimalStringSchema.nullable(),
  valued_line_count: z.number(),
  dead_stock_lines: z.number(),
});

export const InksDashboardSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
  kpis: InksDashboardKpisSchema,
  movement_buckets: z.array(MovementActivityBucketSchema),
  stock_by_company: z.array(StockByCompanySchema),
  top_consumed: z.array(TopConsumedInkLineSchema),
  dead_stock: z.array(InkDeadStockItemSchema),
});

export type InksDashboard = z.infer<typeof InksDashboardSchema>;

export const TopConsumedAdhesiveLineSchema = z.object({
  adhesive_line_id: z.string(),
  name: z.string(),
  out_qty: DecimalStringSchema,
});

export const AdhesivesDashboardKpisSchema = z.object({
  active_lines: z.number(),
  total_qty_on_hand: DecimalStringSchema,
  out_of_stock_lines: z.number(),
  stock_value: DecimalStringSchema.nullable(),
  valued_line_count: z.number(),
});

export const AdhesivesDashboardSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
  kpis: AdhesivesDashboardKpisSchema,
  movement_buckets: z.array(MovementActivityBucketSchema),
  stock_by_company: z.array(StockByCompanySchema),
  top_consumed: z.array(TopConsumedAdhesiveLineSchema),
});

export type AdhesivesDashboard = z.infer<typeof AdhesivesDashboardSchema>;

export const TopConsumedSolventLineSchema = z.object({
  solvent_line_id: z.string(),
  name: z.string(),
  out_qty: DecimalStringSchema,
});

export const SolventsDashboardKpisSchema = z.object({
  active_lines: z.number(),
  total_qty_on_hand: DecimalStringSchema,
  out_of_stock_lines: z.number(),
  stock_value: DecimalStringSchema.nullable(),
  valued_line_count: z.number(),
});

export const SolventsDashboardSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
  kpis: SolventsDashboardKpisSchema,
  movement_buckets: z.array(MovementActivityBucketSchema),
  stock_by_company: z.array(StockByCompanySchema),
  top_consumed: z.array(TopConsumedSolventLineSchema),
});

export type SolventsDashboard = z.infer<typeof SolventsDashboardSchema>;

export type DashboardRangeDays = 7 | 30 | 90;

export function dashboardRangeParams(days: DashboardRangeDays): DashboardRangeParams {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { date_from: toIso(start), date_to: toIso(end) };
}
