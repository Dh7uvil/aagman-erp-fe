import { z } from "zod";

const DecimalStringSchema = z.union([z.string(), z.number()]).transform(String);

export const DashboardRangeParamsSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export type DashboardRangeParams = z.infer<typeof DashboardRangeParamsSchema>;

export const JobStatusCountSchema = z.object({
  status: z.string(),
  count: z.number(),
});

export const JobActivityBucketSchema = z.object({
  bucket_start: z.string(),
  jobs_created: z.number(),
  returns_created: z.number(),
});

export const TopCompanyJobsSchema = z.object({
  company_id: z.string(),
  company_name: z.string(),
  active_jobs: z.number(),
  cylinder_count: z.number(),
});

export const OpenJobPauseSchema = z.object({
  job_id: z.string(),
  job_number: z.string(),
  company_name: z.string(),
  paused_at: z.string(),
  days_paused: z.number(),
});

export const JobsDashboardKpisSchema = z.object({
  active_jobs: z.number(),
  paused_jobs: z.number(),
  cylinders_in_circulation: z.number(),
  awaiting_return: z.number(),
  cylinder_cost_exposure: DecimalStringSchema.nullable(),
});

export const JobsDashboardSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
  kpis: JobsDashboardKpisSchema,
  status_breakdown: z.array(JobStatusCountSchema),
  activity_buckets: z.array(JobActivityBucketSchema),
  top_companies: z.array(TopCompanyJobsSchema),
  open_pauses: z.array(OpenJobPauseSchema),
});

export type JobsDashboard = z.infer<typeof JobsDashboardSchema>;

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

export const MaterialsDashboardKpisSchema = z.object({
  active_skus: z.number(),
  total_kg_on_hand: DecimalStringSchema,
  out_of_stock_skus: z.number(),
  stock_value: DecimalStringSchema.nullable(),
  valued_sku_count: z.number(),
});

export const MaterialsDashboardSchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
  kpis: MaterialsDashboardKpisSchema,
  movement_buckets: z.array(MovementActivityBucketSchema),
  stock_by_product: z.array(StockByProductSchema),
  reorder_watchlist: z.array(ReorderWatchItemSchema),
  top_consumed: z.array(TopConsumedSkuSchema),
});

export type MaterialsDashboard = z.infer<typeof MaterialsDashboardSchema>;

export type DashboardRangeDays = 7 | 30 | 90;

export function dashboardRangeParams(days: DashboardRangeDays): DashboardRangeParams {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { date_from: toIso(start), date_to: toIso(end) };
}
