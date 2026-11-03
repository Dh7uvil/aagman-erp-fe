"use client";

import Link from "next/link";
import { AlertTriangle, Briefcase, CirclePause, Cylinder, IndianRupee, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { KpiCard } from "@/modules/dashboard/components/kpi-card";
import { RankedListCard } from "@/modules/dashboard/components/ranked-list-card";
import { formatBucketLabel } from "@/modules/dashboard/lib/bucket-label";
import { useCylindersDashboard } from "@/modules/dashboard/queries";
import type { DashboardRangeParams } from "@/modules/dashboard/schemas";
import { CYLINDER_STATUS_CHART_COLOR, cylinderStatusChartColor } from "@/modules/inventory/cylinders/lib/cylinder-status-style";
import { cylinderRoutes } from "@/modules/inventory/cylinders/routes";
import { cylinderPermissions, cylinderPricePermissions } from "@/modules/inventory/permissions";
import { SEMANTIC_CHART } from "@/shared/lib/semantic-colors";
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
import { formatDecimal, humanizeEnum } from "@/shared/lib/format";

const STATUS_CHART: ChartConfig = {
  ACTIVE: { label: "Active", color: CYLINDER_STATUS_CHART_COLOR.ACTIVE },
  PAUSED: { label: "Paused", color: CYLINDER_STATUS_CHART_COLOR.PAUSED },
  COMPLETED: { label: "Completed", color: CYLINDER_STATUS_CHART_COLOR.COMPLETED },
  RETURNED: { label: "Returned", color: CYLINDER_STATUS_CHART_COLOR.RETURNED },
};

const ACTIVITY_CHART: ChartConfig = {
  cylinders_created: { label: "New cylinders", color: SEMANTIC_CHART.primary },
  returns_created: { label: "Returns", color: SEMANTIC_CHART.info },
};

function statusColor(status: string): string {
  return cylinderStatusChartColor(status);
}

export function CylindersOverviewSection({ rangeParams }: { rangeParams: DashboardRangeParams }) {
  const can = useCan();
  const canRead = can(cylinderPermissions.read);
  const canViewPrice = can(cylinderPricePermissions.read);
  const query = useCylindersDashboard(rangeParams, canRead);

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
        cylinders_created: row.cylinders_created,
        returns_created: row.returns_created,
      })),
    [query.data?.activity_buckets],
  );

  if (!canRead) {
    return null;
  }

  const kpis = query.data?.kpis;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Cylinders</h2>
        <p className="text-muted-foreground text-sm">
          Production jobs, cylinder circulation, and returns for the selected period.
        </p>
      </div>

      {query.isError ? (
        <p className="text-destructive text-sm">{getErrorMessage(query.error)}</p>
      ) : null}

      <div
        className={
          canViewPrice
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
            : "grid grid-cols-2 gap-3 lg:grid-cols-4"
        }
      >
        <KpiCard
          label="Active jobs"
          icon={Briefcase}
          value={kpis?.active_cylinders}
          isLoading={query.isLoading}
        />
        <KpiCard
          label="Paused"
          icon={CirclePause}
          value={kpis?.paused_cylinders}
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
        {canViewPrice ? (
          <KpiCard
            label="Total cylinder cost"
            icon={IndianRupee}
            displayValue={
              kpis?.cylinder_cost_exposure != null
                ? formatDecimal(kpis.cylinder_cost_exposure)
                : undefined
            }
            isLoading={query.isLoading}
            className="max-sm:col-span-2"
          />
        ) : null}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cylinders by status</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {query.isLoading ? (
              <Skeleton className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[260px]" />
            ) : statusData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No cylinders yet.</p>
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

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity over time</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {query.isLoading ? (
              <Skeleton className="h-[220px] w-full sm:h-[260px]" />
            ) : activityData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No cylinder or return activity in range.</p>
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
                  <Bar dataKey="cylinders_created" fill="var(--color-cylinders_created)" radius={2} />
                  <Bar dataKey="returns_created" fill="var(--color-returns_created)" radius={2} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedListCard
          title="Top companies (active cylinders)"
          isLoading={query.isLoading}
          emptyMessage="No active cylinders by company."
          items={(query.data?.top_companies ?? []).map((row) => (
            <li
              key={row.company_id}
              className="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="min-w-0 truncate font-medium">{row.company_name}</span>
              <span className="text-muted-foreground shrink-0 font-mono text-xs">
                {row.active_cylinders} cylinders · {row.cylinder_count} cyl.
              </span>
            </li>
          ))}
        />

        <RankedListCard
          title="Longest open pauses"
          isLoading={query.isLoading}
          emptyMessage="No cylinders are paused right now."
          items={(query.data?.open_pauses ?? []).map((row) => (
            <li key={row.cylinder_id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <Link
                  href={cylinderRoutes.view(row.cylinder_id)}
                  className="text-primary font-medium hover:underline"
                >
                  {row.cylinder_number}
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
