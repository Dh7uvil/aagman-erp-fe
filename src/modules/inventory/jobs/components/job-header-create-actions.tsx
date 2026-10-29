"use client";

import { Copy, Plus } from "lucide-react";
import Link from "next/link";

import { jobRoutes } from "@/modules/inventory/jobs/routes";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";

export const jobSecondaryHeaderActionClass =
  "border border-primary/20 shadow-none hover:border-primary/45 hover:bg-primary/12 hover:text-accent-foreground hover:shadow-sm active:scale-[0.98]";

export function JobHeaderCreateActions({
  cloneHref,
  onCloneClick,
  showNewJob = true,
  secondaryClassName = jobSecondaryHeaderActionClass,
}: {
  cloneHref?: string;
  onCloneClick?: () => void;
  showNewJob?: boolean;
  secondaryClassName?: string;
}) {
  const cloneControl =
    onCloneClick != null ? (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={secondaryClassName}
        onClick={onCloneClick}
      >
        <Copy className="size-4" />
        Clone job
      </Button>
    ) : cloneHref ? (
      <Button type="button" variant="secondary" size="sm" className={secondaryClassName} asChild>
        <Link href={cloneHref}>
          <Copy className="size-4" />
          Clone job
        </Link>
      </Button>
    ) : null;

  return (
    <>
      {cloneControl}
      {showNewJob ? (
        <Button type="button" size="sm" asChild>
          <Link href={jobRoutes.new}>
            <Plus className="size-4" />
            New job
          </Link>
        </Button>
      ) : null}
    </>
  );
}

export function jobHeaderActionsClassName(className?: string) {
  return cn("flex flex-wrap items-center justify-end gap-2", className);
}
