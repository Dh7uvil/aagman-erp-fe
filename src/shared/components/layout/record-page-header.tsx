"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useSetBreadcrumbRecord } from "@/shared/components/layout/breadcrumb-record";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
  BackLabel,
  CancelLabel,
  EditLabel,
} from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";

export type RecordPageMode = "view" | "edit";

export function RecordPageHeader({
  title,
  subtitle,
  code,
  codeLabel,
  codeTooltip,
  badges,
  listHref,
  viewHref,
  editHref,
  canUpdate = false,
  mode,
  extraActions,
  splitSecondaryActionsOnMobile = false,
}: {
  title: string;
  subtitle?: string;
  code?: string | null;
  codeLabel?: string;
  codeTooltip?: string;
  badges?: ReactNode;
  listHref: string;
  viewHref: string;
  editHref?: string;
  canUpdate?: boolean;
  mode: RecordPageMode;
  extraActions?: ReactNode;
  splitSecondaryActionsOnMobile?: boolean;
}) {
  useSetBreadcrumbRecord(code || title);

  const editAction =
    mode === "view" && canUpdate && editHref ? (
      <Button type="button" size="sm" asChild>
        <Link href={editHref}>
          <EditLabel />
        </Link>
      </Button>
    ) : null;

  const persistAction =
    mode === "edit" ? (
      <Button type="button" variant="outline" size="sm" asChild data-page-header-persist>
        <Link href={viewHref}>
          <CancelLabel />
        </Link>
      </Button>
    ) : (
      <Button type="button" variant="outline" size="sm" asChild data-page-header-persist>
        <Link href={listHref}>
          <BackLabel />
        </Link>
      </Button>
    );

  const allActions = (
    <div className="flex flex-wrap items-center gap-2">
      {extraActions}
      {editAction}
      {persistAction}
    </div>
  );

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      code={code}
      codeLabel={codeLabel}
      codeTooltip={codeTooltip}
      badges={badges}
      actions={allActions}
      mobileHeaderActions={splitSecondaryActionsOnMobile ? persistAction : undefined}
      mobileSecondaryActions={
        splitSecondaryActionsOnMobile ? (
          <>
            {extraActions}
            {editAction}
          </>
        ) : undefined
      }
    />
  );
}
