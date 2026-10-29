"use client";

import { AlertCircle, Package, PackageX, Scale, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { KpiCard } from "@/modules/dashboard/components/kpi-card";
import { RankedListCard } from "@/modules/dashboard/components/ranked-list-card";
import { formatBucketLabel } from "@/modules/dashboard/lib/bucket-label";
import { useMaterialsDashboard } from "@/modules/dashboard/queries";
import type { DashboardRangeParams } from "@/modules/dashboard/schemas";
import { materialPermissions } from "@/modules/inventory/permissions";
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

const MOVEMENT_CHART: ChartConfig = {
  in_kg: { label: "IN (kg)", color: "var(--chart-1)" },
  out_kg: { label: "OUT (kg)", color: "var(--chart-4)" },
};

const PRODUCT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function MaterialsOverviewSection({ rangeParams }: { rangeParams: DashboardRangeParams }) {
  const can = useCan();
  const canRead = can(materialPermissions.read);
  const query = useMaterialsDashboard(rangeParams, canRead);

  const movementData = useMemo(
    () =>
      (query.data?.movement_buckets ?? []).map((row) => ({
        bucket: formatBucketLabel(row.bucket_start),
        in_kg: Number.parseFloat(row.in_kg),
        out_kg: Number.parseFloat(row.out_kg),
      })),
    [query.data?.movement_buckets],
  );

  const productData = useMemo(
    () =>
      (query.data?.stock_by_product ?? []).slice(0, 8).map((row, index) => ({
        name: row.product_name,
        total_kg: Number.parseFloat(row.total_kg),
        fill: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
      })),
    [query.data?.stock_by_product],
  );

  const productChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    productData.forEach((row) => {
      config[row.name] = { label: row.name, color: row.fill };
    });
    return config;
  }, [productData]);

  if (!canRead) {
    return null;
  }

  const kpis = query.data?.kpis;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Materials & stock</h2>
        <p className="text-muted-foreground text-sm">
          On-hand inventory, movement, and consumption signals for the selected period.
        </p>
      </div>

      {query.isError ? (
        <p className="text-destructive text-sm">{getErrorMessage(query.error)}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label="Active SKUs"
          icon={Package}
          value={kpis?.active_skus}
          isLoading={query.isLoading}
        />
        <KpiCard
          label="Total kg on hand"
          icon={Scale}
          displayValue={kpis ? formatDecimal(kpis.total_kg_on_hand) : undefined}
          unit="kg"
          isLoading={query.isLoading}
        />
        <KpiCard
          label="Out of stock"
          icon={PackageX}
          value={kpis?.out_of_stock_skus}
          isLoading={query.isLoading}
          className="max-lg:col-span-2"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Movement (kg)</CardTitle>
          </CardHeader>
          <CardContent>
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

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock by product</CardTitle>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <Skeleton className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[260px]" />
            ) : productData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No stock recorded.</p>
            ) : (
              <ChartContainer
                config={productChartConfig}
                className="mx-auto aspect-square max-h-[220px] w-full sm:max-h-[260px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                  <Pie data={productData} dataKey="total_kg" nameKey="name" innerRadius={50}>
                    {productData.map((entry) => (
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

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedListCard
          title="Reorder watchlist (shortest cover)"
          isLoading={query.isLoading}
          emptyMessage="No consumption-based reorder signals in range."
          items={(query.data?.reorder_watchlist ?? []).map((row) => (
            <li
              key={row.material_id}
              className="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="min-w-0 truncate font-medium">{row.name}</span>
              <span className="text-muted-foreground flex shrink-0 items-center gap-1 font-mono text-xs">
                <TrendingDown className="size-3" />
                {formatDecimal(row.days_of_cover)}d cover
              </span>
            </li>
          ))}
        />

        <RankedListCard
          title="Top consumed (OUT kg)"
          isLoading={query.isLoading}
          emptyMessage="No OUT movements in range."
          items={(query.data?.top_consumed ?? []).map((row) => (
            <li key={row.material_id} className="flex items-center justify-between py-2 text-sm">
              <span className="min-w-0 truncate font-medium">{row.name}</span>
              <span className="text-muted-foreground font-mono text-xs">
                {formatDecimal(row.out_kg)} kg
              </span>
            </li>
          ))}
        />
      </div>

      {!query.isLoading && (kpis?.out_of_stock_skus ?? 0) > 0 ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <AlertCircle className="size-3.5" />
          {kpis?.out_of_stock_skus} SKU(s) are at zero kg on hand.
        </p>
      ) : null}
    </section>
  );
}
