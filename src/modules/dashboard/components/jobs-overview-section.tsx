"use client";

import Link from "next/link";
import { AlertTriangle, Briefcase, CirclePause, Cylinder, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { KpiCard } from "@/modules/dashboard/components/kpi-card";
import { RankedListCard } from "@/modules/dashboard/components/ranked-list-card";
import { formatBucketLabel } from "@/modules/dashboard/lib/bucket-label";
import { useJobsDashboard } from "@/modules/dashboard/queries";
import type { DashboardRangeParams } from "@/modules/dashboard/schemas";
import { jobRoutes } from "@/modules/inventory/jobs/routes";
import { jobPermissions } from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useCan } from "@/shared/providers/session-provider";
import { humanizeEnum } from "@/shared/lib/format";

const STATUS_CHART: ChartConfig = {
  ACTIVE: { label: "Active", color: "var(--chart-1)" },
  RESUMED: { label: "Resumed", color: "var(--chart-2)" },
  PAUSED: { label: "Paused", color: "var(--chart-3)" },
  COMPLETED: { label: "Completed", color: "var(--chart-4)" },
  RETURNED: { label: "Returned", color: "var(--chart-5)" },
};

const ACTIVITY_CHART: ChartConfig = {
  jobs_created: { label: "New jobs", color: "var(--chart-1)" },
  returns_created: { label: "Returns", color: "var(--chart-2)" },
};

function statusColor(status: string): string {
  const entry = STATUS_CHART[status];
  if (entry && "color" in entry && entry.color) {
    return entry.color;
  }
  return "var(--muted-foreground)";
}

export function JobsOverviewSection({ rangeParams }: { rangeParams: DashboardRangeParams }) {
  const can = useCan();
  const canRead = can(jobPermissions.read);
  const query = useJobsDashboard(rangeParams, canRead);

  const statusData = useMemo(
    () =>
      (query.data?.status_breakdown ?? []).map((row) => ({
        status: row.status,
        label: humanizeEnum(row.status),
        count: row.count,
        fill: statusColor(row.status),
      })),
    [query.data?.status_breakdown],
  );

  const activityData = useMemo(
    () =>
      (query.data?.activity_buckets ?? []).map((row) => ({
        bucket: formatBucketLabel(row.bucket_start),
        jobs_created: row.jobs_created,
        returns_created: row.returns_created,
      })),
    [query.data?.activity_buckets],
  );

  if (!canRead) {
    return null;
  }

  const kpis = query.data?.kpis;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Jobs & cylinders</h2>
        <p className="text-muted-foreground text-sm">
          Production jobs, cylinder circulation, and returns for the selected period.
        </p>
      </div>

      {query.isError ? (
        <p className="text-destructive text-sm">{getErrorMessage(query.error)}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Active jobs"
          icon={Briefcase}
          value={kpis?.active_jobs}
          isLoading={query.isLoading}
        />
        <KpiCard
          label="Paused"
          icon={CirclePause}
          value={kpis?.paused_jobs}
          isLoading={query.isLoading}
        />
        <KpiCard
          label="Cylinders out"
          icon={Cylinder}
          value={kpis?.cylinders_in_circulation}
          isLoading={query.isLoading}
        />
        <KpiCard
          label="Awaiting return"
          icon={RotateCcw}
          value={kpis?.awaiting_return}
          isLoading={query.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jobs by status</CardTitle>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <Skeleton className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[260px]" />
            ) : statusData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No jobs yet.</p>
            ) : (
              <ChartContainer
                config={STATUS_CHART}
                className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[260px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
                  <Pie data={statusData} dataKey="count" nameKey="label" innerRadius={50}>
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="status" className="flex-wrap" />}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity over time</CardTitle>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <Skeleton className="h-[220px] w-full sm:h-[260px]" />
            ) : activityData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No job or return activity in range.</p>
            ) : (
              <ChartContainer config={ACTIVITY_CHART} className="h-[220px] w-full sm:h-[260px]">
                <BarChart data={activityData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    minTickGap={24}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="jobs_created" fill="var(--color-jobs_created)" radius={2} />
                  <Bar dataKey="returns_created" fill="var(--color-returns_created)" radius={2} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedListCard
          title="Top companies (active jobs)"
          isLoading={query.isLoading}
          emptyMessage="No active jobs by company."
          items={(query.data?.top_companies ?? []).map((row) => (
            <li
              key={row.company_id}
              className="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="min-w-0 truncate font-medium">{row.company_name}</span>
              <span className="text-muted-foreground shrink-0 font-mono text-xs">
                {row.active_jobs} jobs · {row.cylinder_count} cyl.
              </span>
            </li>
          ))}
        />

        <RankedListCard
          title="Longest open pauses"
          isLoading={query.isLoading}
          emptyMessage="No jobs are paused right now."
          items={(query.data?.open_pauses ?? []).map((row) => (
            <li key={row.job_id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <Link
                  href={jobRoutes.view(row.job_id)}
                  className="text-primary font-medium hover:underline"
                >
                  {row.job_number}
                </Link>
                <p className="text-muted-foreground truncate text-xs">{row.company_name}</p>
              </div>
              <span className="text-muted-foreground flex shrink-0 items-center gap-1 font-mono text-xs">
                <AlertTriangle className="size-3" />
                {row.days_paused}d
              </span>
            </li>
          ))}
        />
      </div>
    </section>
  );
}
