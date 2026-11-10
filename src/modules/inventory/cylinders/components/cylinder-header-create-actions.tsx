"use client";

import { Copy, Plus } from "lucide-react";
import Link from "next/link";

import { cylinderRoutes } from "@/modules/inventory/cylinders/routes";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";

export const cylinderSecondaryHeaderActionClass =
  "border border-primary/20 shadow-none hover:border-primary/45 hover:bg-primary/12 hover:text-accent-foreground hover:shadow-sm active:scale-[0.98]";

export function CylinderHeaderCreateActions({
  cloneHref,
  onCloneClick,
  showNewCylinder = true,
  secondaryClassName = cylinderSecondaryHeaderActionClass,
}: {
  cloneHref?: string;
  onCloneClick?: () => void;
  showNewCylinder?: boolean;
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
        Clone cylinder
      </Button>
    ) : cloneHref ? (
      <Button type="button" variant="secondary" size="sm" className={secondaryClassName} asChild>
        <Link href={cloneHref}>
          <Copy className="size-4" />
          Clone cylinder
        </Link>
      </Button>
    ) : null;

  return (
    <>
      {cloneControl}
      {showNewCylinder ? (
        <Button type="button" size="sm" asChild>
          <Link href={cylinderRoutes.new}>
            <Plus className="size-4" />
            New cylinder
          </Link>
        </Button>
      ) : null}
    </>
  );
}

export function cylinderHeaderActionsClassName(className?: string) {
  return cn("flex flex-wrap items-center justify-end gap-2", className);
}
