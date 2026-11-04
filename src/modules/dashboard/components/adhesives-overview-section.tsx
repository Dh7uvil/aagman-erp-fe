"use client";

import { AlertCircle, IndianRupee, Package, PackageX, Scale } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { KpiCard } from "@/modules/dashboard/components/kpi-card";
import { RankedListCard } from "@/modules/dashboard/components/ranked-list-card";
import { formatBucketLabel } from "@/modules/dashboard/lib/bucket-label";
import { useAdhesivesDashboard } from "@/modules/dashboard/queries";
import type { DashboardRangeParams } from "@/modules/dashboard/schemas";
import { adhesivePermissions, adhesivePricePermissions } from "@/modules/inventory/permissions";
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
import { formatDecimal } from "@/shared/lib/format";
import { CATEGORICAL_CHART_COLORS, SEMANTIC_CHART } from "@/shared/lib/semantic-colors";

const MOVEMENT_CHART: ChartConfig = {
  in_kg: { label: "IN (qty)", color: SEMANTIC_CHART.success },
  out_kg: { label: "OUT (qty)", color: SEMANTIC_CHART.warning },
};

const COMPANY_COLORS = CATEGORICAL_CHART_COLORS;

export function AdhesivesOverviewSection({ rangeParams }: { rangeParams: DashboardRangeParams }) {
  const can = useCan();
  const canRead = can(adhesivePermissions.read);
  const canViewPrice = can(adhesivePricePermissions.read);
  const query = useAdhesivesDashboard(rangeParams, canRead);

  const movementData = useMemo(
    () =>
      (query.data?.movement_buckets ?? []).map((row) => ({
        bucket: formatBucketLabel(row.bucket_start),
        in_kg: Number.parseFloat(row.in_kg),
        out_kg: Number.parseFloat(row.out_kg),
      })),
    [query.data?.movement_buckets],
  );

  const companyData = useMemo(
    () =>
      (query.data?.stock_by_company ?? []).slice(0, 8).map((row, index) => ({
        name: row.company_name,
        total_qty: Number.parseFloat(row.total_qty),
        fill: COMPANY_COLORS[index % COMPANY_COLORS.length],
      })),
    [query.data?.stock_by_company],
  );

  const companyChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    companyData.forEach((row) => {
      config[row.name] = { label: row.name, color: row.fill };
    });
    return config;
  }, [companyData]);

  if (!canRead) {
    return null;
  }

  const kpis = query.data?.kpis;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Adhesives & stock</h2>
        <p className="text-muted-foreground text-sm">
          On-hand adhesive inventory, movement, and consumption for the selected period.
        </p>
      </div>

      {query.isError ? (
        <p className="text-destructive text-sm">{getErrorMessage(query.error)}</p>
      ) : null}

      <div
        className={
          canViewPrice
            ? "grid grid-cols-2 gap-3 lg:grid-cols-4"
            : "grid grid-cols-2 gap-3 lg:grid-cols-3"
        }
      >
        <KpiCard
          label="Active lines"
          icon={Package}
          value={kpis?.active_lines}
          isLoading={query.isLoading}
        />
        <KpiCard
          label="Total qty on hand"
          icon={Scale}
          displayValue={kpis ? formatDecimal(kpis.total_qty_on_hand) : undefined}
          isLoading={query.isLoading}
        />
        <KpiCard
          label="Out of stock"
          icon={PackageX}
          value={kpis?.out_of_stock_lines}
          isLoading={query.isLoading}
        />
        {canViewPrice ? (
          <KpiCard
            label="Stock valuation"
            icon={IndianRupee}
            displayValue={
              kpis?.stock_value != null ? formatDecimal(kpis.stock_value) : undefined
            }
            isLoading={query.isLoading}
          />
        ) : null}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Movement (qty)</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {query.isLoading ? (
              <Skeleton className="h-[220px] w-full sm:h-[260px]" />
            ) : movementData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No movements in range.</p>
            ) : (
              <ChartContainer config={MOVEMENT_CHART} className="h-[220px] w-full sm:h-[260px]">
                <BarChart data={movementData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    minTickGap={24}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickLine={false} axisLine={false} width={36} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="in_kg" fill="var(--color-in_kg)" radius={2} />
                  <Bar dataKey="out_kg" fill="var(--color-out_kg)" radius={2} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock by company</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {query.isLoading ? (
              <Skeleton className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[260px]" />
            ) : companyData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No stock recorded.</p>
            ) : (
              <ChartContainer
                config={companyChartConfig}
                className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[260px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                  <Pie data={companyData} dataKey="total_qty" nameKey="name" innerRadius={50}>
                    {companyData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" className="flex-wrap" />}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <RankedListCard
        title="Top consumed (OUT qty)"
        isLoading={query.isLoading}
        emptyMessage="No OUT movements in range."
        items={(query.data?.top_consumed ?? []).map((row) => (
          <li key={row.adhesive_line_id} className="flex items-center justify-between py-2 text-sm">
            <span className="min-w-0 truncate font-medium">{row.name}</span>
            <span className="text-muted-foreground font-mono text-xs">
              {formatDecimal(row.out_qty)}
            </span>
          </li>
        ))}
      />

      {!query.isLoading && (kpis?.out_of_stock_lines ?? 0) > 0 ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <AlertCircle className="size-3.5" />
          {kpis?.out_of_stock_lines} line(s) are at zero quantity on hand.
        </p>
      ) : null}
    </section>
  );
}
