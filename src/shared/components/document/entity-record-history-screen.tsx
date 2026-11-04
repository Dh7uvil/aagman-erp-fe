"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useCylinderReturnHistory } from "@/modules/inventory/cylinder-returns/queries";
import { useCylinder, useCylinderHistory } from "@/modules/inventory/cylinders/queries";
import { useInkColorHistory } from "@/modules/inventory/ink-colors/queries";
import { useInk, useInkHistory } from "@/modules/inventory/inks/queries";
import { MaterialHistoryCard } from "@/modules/inventory/materials/components/material-history-card";
import { materialHistoryBreadcrumbCrumbs } from "@/modules/inventory/materials/material-breadcrumb";
import { useMaterial } from "@/modules/inventory/materials/queries";
import {
  useMaterialHistory,
  useMaterialHistorySummary,
} from "@/modules/inventory/materials/queries";
import { inventoryPricePermissions } from "@/modules/inventory/permissions";
import { useCan } from "@/shared/providers/session-provider";
import {
  EntityHistoryCard,
  resolveInkAttachmentUrl,
} from "@/shared/components/document/entity-history-card";
import type { EntityHistoryEntry } from "@/modules/inventory/cylinders/schemas";
import {
  useSetBreadcrumbRecord,
  useSetBreadcrumbTrail,
} from "@/shared/components/layout/breadcrumb-record";
import { PageHeader } from "@/shared/components/layout/page-header";
import { BackLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  getHistoryResource,
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
    resource === "materials" ? null : code || spec?.label || "Details",
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
    return (
      <InkSheetRecordHistory
        id={id}
        viewHref={viewHref}
        code={code}
        pageTitle={pageTitle}
        recordLabel="Ink sheet"
        supportsAttachments={spec.supportsAttachments}
      />
    );
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

function InkSheetRecordHistory({
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
  const historyQuery = useInkHistory(id);
  const sheetQuery = useInk(id);
  const resolveAttachmentUrl = useMemo(
    () => (entry: EntityHistoryEntry) => resolveInkAttachmentUrl(id, entry, sheetQuery.data),
    [id, sheetQuery.data],
  );
  return (
    <RecordHistoryLayout
      viewHref={viewHref}
      code={code}
      pageTitle={pageTitle}
      recordLabel={recordLabel}
      entries={historyQuery.data}
      isLoading={historyQuery.isLoading || sheetQuery.isLoading}
      isError={historyQuery.isError}
      onRetry={() => void historyQuery.refetch()}
      resolveAttachmentUrl={resolveAttachmentUrl}
      supportsAttachments={supportsAttachments}
    />
  );
}
