"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useCylinderReturnHistory } from "@/modules/inventory/cylinder-returns/queries";
import { useCylinder, useCylinderHistory } from "@/modules/inventory/cylinders/queries";
import { useAdhesiveCodeHistory } from "@/modules/inventory/adhesive-codes/queries";
import {
  useAdhesive,
  useAdhesiveLineHistory,
  useAdhesiveLineHistorySummary,
} from "@/modules/inventory/adhesives/queries";
import { adhesiveRoutes } from "@/modules/inventory/adhesives/routes";
import { useInkColorHistory } from "@/modules/inventory/ink-colors/queries";
import {
  useInk,
  useInkLineHistory,
  useInkLineHistorySummary,
} from "@/modules/inventory/inks/queries";
import { inkRoutes } from "@/modules/inventory/inks/routes";
import { DrumLineHistoryCard } from "@/modules/inventory/components/drum-line-history-card";
import type {
  DrumLineHistoryEntry,
  DrumLineHistorySummary,
} from "@/modules/inventory/schemas/drum-line-history";
import { MaterialHistoryCard } from "@/modules/inventory/materials/components/material-history-card";
import { materialHistoryBreadcrumbCrumbs } from "@/modules/inventory/materials/material-breadcrumb";
import { useMaterial } from "@/modules/inventory/materials/queries";
import {
  useMaterialHistory,
  useMaterialHistorySummary,
} from "@/modules/inventory/materials/queries";
import {
  adhesivePricePermissions,
  inkPricePermissions,
  inventoryPricePermissions,
} from "@/modules/inventory/permissions";
import { useCan } from "@/shared/providers/session-provider";
import { EntityHistoryCard } from "@/shared/components/document/entity-history-card";
import { DataTableError } from "@/shared/components/data-table/states";
import type { EntityHistoryEntry } from "@/modules/inventory/cylinders/schemas";
import {
  useSetBreadcrumbRecord,
  useSetBreadcrumbTrail,
} from "@/shared/components/layout/breadcrumb-record";
import { PageHeader } from "@/shared/components/layout/page-header";
import { BackLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  getHistoryResource,
  historyHref,
  historyPageTitle,
  historyViewHref,
  isHistoryResource,
  type HistoryResource,
} from "@/shared/lib/history";

export function EntityRecordHistoryScreen({ resource, id }: { resource: string; id: string }) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const valid = isHistoryResource(resource);
  const spec = valid ? getHistoryResource(resource) : undefined;

  useSetBreadcrumbRecord(
    resource === "materials" ||
      resource === "adhesive-lines" ||
      resource === "ink-lines"
      ? null
      : code || spec?.label || "Details",
  );

  if (!valid || !spec) {
    return (
      <p className="text-muted-foreground p-6 text-sm">History is not available for this record.</p>
    );
  }

  const viewHref = historyViewHref(resource as HistoryResource, id);
  const pageTitle = historyPageTitle();

  if (resource === "cylinders") {
    return (
      <CylinderRecordHistory
        id={id}
        viewHref={viewHref}
        code={code}
        pageTitle={pageTitle}
        recordLabel="Cylinder"
        supportsAttachments={spec.supportsAttachments}
      />
    );
  }

  if (resource === "cylinder-returns") {
    return (
      <CylinderReturnRecordHistory
        id={id}
        viewHref={viewHref}
        code={code}
        pageTitle={pageTitle}
        recordLabel="Cylinder return"
        supportsAttachments={spec.supportsAttachments}
      />
    );
  }

  if (resource === "materials") {
    return (
      <MaterialRecordHistory
        id={id}
        viewHref={viewHref}
        code={code}
        pageTitle={pageTitle}
        recordLabel="Material"
      />
    );
  }

  if (resource === "adhesive-lines") {
    return <AdhesiveLineMovementsHistory id={id} pageTitle={pageTitle} subtitle={code} />;
  }

  if (resource === "ink-lines") {
    return <InkLineMovementsHistory id={id} pageTitle={pageTitle} subtitle={code} />;
  }

  if (resource === "ink-colors") {
    return (
      <InkColorRecordHistory
        id={id}
        viewHref={viewHref}
        code={code}
        pageTitle={pageTitle}
        recordLabel="Ink"
        supportsAttachments={spec.supportsAttachments}
      />
    );
  }

  if (resource === "inks") {
    return <InkSheetHistoryGateway id={id} viewHref={viewHref} pageTitle={pageTitle} />;
  }

  if (resource === "adhesive-codes") {
    return (
      <AdhesiveCodeRecordHistory
        id={id}
        viewHref={viewHref}
        code={code}
        pageTitle={pageTitle}
        recordLabel="Adhesive code"
        supportsAttachments={spec.supportsAttachments}
      />
    );
  }

  if (resource === "adhesives") {
    return <AdhesiveSheetHistoryGateway id={id} viewHref={viewHref} pageTitle={pageTitle} />;
  }

  return (
    <p className="text-muted-foreground p-6 text-sm">History is not available for this record.</p>
  );
}

function RecordHistoryLayout({
  viewHref,
  code,
  pageTitle,
  recordLabel,
  entries,
  isLoading,
  isError,
  onRetry,
  cylinderId,
  cylinder,
  resolveAttachmentUrl,
  supportsAttachments,
}: {
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel?: string;
  entries: ReturnType<typeof useCylinderHistory>["data"];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  cylinderId?: string;
  cylinder?: ReturnType<typeof useCylinder>["data"];
  resolveAttachmentUrl?: (entry: EntityHistoryEntry) => string | null;
  supportsAttachments: boolean;
}) {
  const subtitle = code ? (recordLabel ? `${recordLabel} · ${code}` : code) : recordLabel;

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        title={pageTitle}
        subtitle={subtitle}
        actions={
          <Button type="button" variant="outline" size="sm" asChild data-page-header-persist>
            <Link href={viewHref}>
              <BackLabel>
                <span className="sm:hidden">Back</span>
                <span className="hidden sm:inline">Back to record</span>
              </BackLabel>
            </Link>
          </Button>
        }
      />
      <EntityHistoryCard
        showTitle={false}
        entries={entries}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        cylinderId={cylinderId}
        cylinder={cylinder}
        resolveAttachmentUrl={resolveAttachmentUrl}
        supportsAttachments={supportsAttachments}
      />
    </div>
  );
}

function CylinderRecordHistory({
  id,
  viewHref,
  code,
  pageTitle,
  recordLabel,
  supportsAttachments,
}: {
  id: string;
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel: string;
  supportsAttachments: boolean;
}) {
  const historyQuery = useCylinderHistory(id);
  const cylinderQuery = useCylinder(id);
  return (
    <RecordHistoryLayout
      viewHref={viewHref}
      code={code}
      pageTitle={pageTitle}
      recordLabel={recordLabel}
      entries={historyQuery.data}
      isLoading={historyQuery.isLoading || cylinderQuery.isLoading}
      isError={historyQuery.isError}
      onRetry={() => void historyQuery.refetch()}
      cylinderId={id}
      cylinder={cylinderQuery.data}
      supportsAttachments={supportsAttachments}
    />
  );
}

function DrumLineMovementsHistory({
  pageTitle,
  subtitle,
  viewHref,
  detailLabel,
  historyQuery,
  summaryQuery,
  canViewPrice,
}: {
  pageTitle: string;
  subtitle?: string | null;
  viewHref: string;
  detailLabel: "Code" | "Color";
  historyQuery: { data?: DrumLineHistoryEntry[]; isLoading: boolean };
  summaryQuery: { data?: DrumLineHistorySummary; isLoading: boolean };
  canViewPrice: boolean;
}) {
  const headerSubtitle =
    subtitle?.trim() ||
    (summaryQuery.data?.company_name?.trim() ? summaryQuery.data.company_name : undefined);

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        title={pageTitle}
        subtitle={headerSubtitle}
        actions={
          <Button type="button" variant="outline" size="sm" asChild data-page-header-persist>
            <Link href={viewHref}>
              <BackLabel>
                <span className="sm:hidden">Back</span>
                <span className="hidden sm:inline">Back to record</span>
              </BackLabel>
            </Link>
          </Button>
        }
      />
      <DrumLineHistoryCard
        summary={summaryQuery.data}
        entries={historyQuery.data ?? []}
        loading={historyQuery.isLoading || summaryQuery.isLoading}
        canViewPrice={canViewPrice}
        detailLabel={detailLabel}
      />
    </div>
  );
}

function AdhesiveLineMovementsHistory({
  id,
  pageTitle,
  subtitle,
}: {
  id: string;
  pageTitle: string;
  subtitle?: string | null;
}) {
  const can = useCan();
  const canViewPrice = can(adhesivePricePermissions.read);
  const historyQuery = useAdhesiveLineHistory(id);
  const summaryQuery = useAdhesiveLineHistorySummary(id);
  const viewHref = summaryQuery.data
    ? adhesiveRoutes.view(summaryQuery.data.sheet_id)
    : adhesiveRoutes.list;

  return (
    <DrumLineMovementsHistory
      pageTitle={pageTitle}
      subtitle={subtitle}
      viewHref={viewHref}
      detailLabel="Code"
      historyQuery={historyQuery}
      summaryQuery={summaryQuery}
      canViewPrice={canViewPrice}
    />
  );
}

function InkLineMovementsHistory({
  id,
  pageTitle,
  subtitle,
}: {
  id: string;
  pageTitle: string;
  subtitle?: string | null;
}) {
  const can = useCan();
  const canViewPrice = can(inkPricePermissions.read);
  const historyQuery = useInkLineHistory(id);
  const summaryQuery = useInkLineHistorySummary(id);
  const viewHref = summaryQuery.data ? inkRoutes.view(summaryQuery.data.sheet_id) : inkRoutes.list;

  return (
    <DrumLineMovementsHistory
      pageTitle={pageTitle}
      subtitle={subtitle}
      viewHref={viewHref}
      detailLabel="Color"
      historyQuery={historyQuery}
      summaryQuery={summaryQuery}
      canViewPrice={canViewPrice}
    />
  );
}

function MaterialRecordHistory({
  id,
  viewHref,
  pageTitle,
  recordLabel,
}: {
  id: string;
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel: string;
}) {
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const materialQuery = useMaterial(id);
  const historyQuery = useMaterialHistory(id);
  const summaryQuery = useMaterialHistorySummary(id);
  const companyName = summaryQuery.data?.company_name?.trim();
  const subtitle = companyName || undefined;

  const breadcrumbTrail = useMemo(
    () => materialHistoryBreadcrumbCrumbs(id, summaryQuery.data, materialQuery.data),
    [id, summaryQuery.data, materialQuery.data],
  );
  useSetBreadcrumbTrail(breadcrumbTrail);

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        title={pageTitle}
        subtitle={subtitle}
        actions={
          <Button type="button" variant="outline" size="sm" asChild data-page-header-persist>
            <Link href={viewHref}>
              <BackLabel>
                <span className="sm:hidden">Back</span>
                <span className="hidden sm:inline">Back to record</span>
              </BackLabel>
            </Link>
          </Button>
        }
      />
      <MaterialHistoryCard
        summary={summaryQuery.data}
        entries={historyQuery.data ?? []}
        loading={historyQuery.isLoading || summaryQuery.isLoading}
        canViewPrice={canViewPrice}
      />
    </div>
  );
}

function CylinderReturnRecordHistory({
  id,
  viewHref,
  code,
  pageTitle,
  recordLabel,
  supportsAttachments,
}: {
  id: string;
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel: string;
  supportsAttachments: boolean;
}) {
  const historyQuery = useCylinderReturnHistory(id);
  return (
    <RecordHistoryLayout
      viewHref={viewHref}
      code={code}
      pageTitle={pageTitle}
      recordLabel={recordLabel}
      entries={historyQuery.data}
      isLoading={historyQuery.isLoading}
      isError={historyQuery.isError}
      onRetry={() => void historyQuery.refetch()}
      supportsAttachments={supportsAttachments}
    />
  );
}

function InkColorRecordHistory({
  id,
  viewHref,
  code,
  pageTitle,
  recordLabel,
  supportsAttachments,
}: {
  id: string;
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel: string;
  supportsAttachments: boolean;
}) {
  const historyQuery = useInkColorHistory(id);
  return (
    <RecordHistoryLayout
      viewHref={viewHref}
      code={code}
      pageTitle={pageTitle}
      recordLabel={recordLabel}
      entries={historyQuery.data}
      isLoading={historyQuery.isLoading}
      isError={historyQuery.isError}
      onRetry={() => void historyQuery.refetch()}
      supportsAttachments={supportsAttachments}
    />
  );
}

function AdhesiveCodeRecordHistory({
  id,
  viewHref,
  code,
  pageTitle,
  recordLabel,
  supportsAttachments,
}: {
  id: string;
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel: string;
  supportsAttachments: boolean;
}) {
  const historyQuery = useAdhesiveCodeHistory(id);
  return (
    <RecordHistoryLayout
      viewHref={viewHref}
      code={code}
      pageTitle={pageTitle}
      recordLabel={recordLabel}
      entries={historyQuery.data}
      isLoading={historyQuery.isLoading}
      isError={historyQuery.isError}
      onRetry={() => void historyQuery.refetch()}
      supportsAttachments={supportsAttachments}
    />
  );
}

function DrumLineSheetHistoryGateway<Line extends { id: string }>({
  pageTitle,
  viewHref,
  sheetQuery,
  lineResource,
  lineLabel,
}: {
  pageTitle: string;
  viewHref: string;
  sheetQuery: {
    data?: { lines: Line[] };
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };
  lineResource: "ink-lines" | "adhesive-lines";
  lineLabel: (line: Line) => string;
}) {
  const router = useRouter();
  const lines = sheetQuery.data?.lines ?? [];

  useEffect(() => {
    if (sheetQuery.isLoading || lines.length !== 1) {
      return;
    }
    router.replace(historyHref(lineResource, lines[0].id));
  }, [lineResource, lines, router, sheetQuery.isLoading]);

  if (sheetQuery.isLoading || (lines.length === 1 && !sheetQuery.isError)) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (sheetQuery.isError) {
    return (
      <DataTableError message="Could not load this sheet." onRetry={() => void sheetQuery.refetch()} />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex w-full flex-col gap-5">
        <PageHeader
          title={pageTitle}
          actions={
            <Button type="button" variant="outline" size="sm" asChild data-page-header-persist>
              <Link href={viewHref}>
                <BackLabel>
                  <span className="sm:hidden">Back</span>
                  <span className="hidden sm:inline">Back to record</span>
                </BackLabel>
              </Link>
            </Button>
          }
        />
        <p className="text-muted-foreground text-sm">This sheet has no lines yet.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        title={pageTitle}
        subtitle="Select a line for stock history"
        actions={
          <Button type="button" variant="outline" size="sm" asChild data-page-header-persist>
            <Link href={viewHref}>
              <BackLabel>
                <span className="sm:hidden">Back</span>
                <span className="hidden sm:inline">Back to record</span>
              </BackLabel>
            </Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="divide-y p-0">
          {lines.map((line) => (
            <Link
              key={line.id}
              href={historyHref(lineResource, line.id)}
              className="hover:bg-muted/50 flex items-center justify-between px-4 py-3 text-sm"
            >
              <span>{lineLabel(line)}</span>
              <span className="text-primary text-sm font-medium">View history</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InkSheetHistoryGateway({
  id,
  viewHref,
  pageTitle,
}: {
  id: string;
  viewHref: string;
  pageTitle: string;
}) {
  const sheetQuery = useInk(id);
  return (
    <DrumLineSheetHistoryGateway
      pageTitle={pageTitle}
      viewHref={viewHref}
      sheetQuery={sheetQuery}
      lineResource="ink-lines"
      lineLabel={(line) => {
        const brand = line.brand_name?.trim() || "—";
        const color = line.color_name?.trim() || "—";
        return `${brand} · ${color}`;
      }}
    />
  );
}

function AdhesiveSheetHistoryGateway({
  id,
  viewHref,
  pageTitle,
}: {
  id: string;
  viewHref: string;
  pageTitle: string;
}) {
  const sheetQuery = useAdhesive(id);
  return (
    <DrumLineSheetHistoryGateway
      pageTitle={pageTitle}
      viewHref={viewHref}
      sheetQuery={sheetQuery}
      lineResource="adhesive-lines"
      lineLabel={(line) => {
        const brand = line.brand_name?.trim() || "—";
        const code = line.code?.trim() || "—";
        return `${brand} · ${code}`;
      }}
    />
  );
}
