"use client";

import { Copy, Edit2, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { useDropdownMenuNavigationSync } from "@/shared/hooks/use-dropdown-menu-navigation-sync";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export function hasRowActions(...flags: Array<unknown>): boolean {
  return flags.some(Boolean);
}

export function tableHeaders<T extends string>(
  columns: readonly T[],
  showActions: boolean,
): readonly string[] {
  return showActions ? [...columns, "Actions"] : columns;
}

export function TableActionTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function wrapLabeledActions(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) {
      return child;
    }
    if (child.type === Fragment) {
      return wrapLabeledActions((child.props as { children?: ReactNode }).children);
    }
    if (child.type === TableActionTooltip) {
      return child;
    }
    const props = child.props as { "aria-label"?: string; title?: string };
    const label = props["aria-label"] ?? props.title;
    if (!label) {
      return child;
    }
    return (
      <TableActionTooltip label={label}>
        {cloneElement(child as ReactElement<Record<string, unknown>>, { title: undefined })}
      </TableActionTooltip>
    );
  });
}

function actionLabel(verb: string, entityName?: string | null) {
  const trimmed = entityName?.trim();
  return trimmed ? `${verb} ${trimmed}` : verb;
}

type RowActionMenuItem = {
  key: string;
  label: string;
  destructive?: boolean;
  onSelect?: () => void;
  href?: string;
};

export function DataTableRowActions({
  entityName,
  onView,
  viewHref,
  onEdit,
  editHref,
  onClone,
  cloneHref,
  onDelete,
  extra,
}: {
  entityName?: string | null;
  onView?: () => void;
  viewHref?: string;
  onEdit?: () => void;
  editHref?: string;
  onClone?: () => void;
  cloneHref?: string;
  onDelete?: () => void;
  extra?: ReactNode;
}) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useDropdownMenuNavigationSync();

  if (
    !onView &&
    !viewHref &&
    !onEdit &&
    !editHref &&
    !onClone &&
    !cloneHref &&
    !onDelete &&
    !extra
  ) {
    return null;
  }

  const viewLabel = actionLabel("View", entityName);
  const editLabel = actionLabel("Edit", entityName);
  const cloneLabel = actionLabel("Clone", entityName);
  const deleteLabel = actionLabel("Delete", entityName);

  const menuItems: RowActionMenuItem[] = [];
  if (viewHref || onView) {
    menuItems.push({
      key: "view",
      label: viewLabel,
      href: viewHref,
      onSelect: onView,
    });
  }
  if (editHref || onEdit) {
    menuItems.push({
      key: "edit",
      label: editLabel,
      href: editHref,
      onSelect: onEdit,
    });
  }
  if (cloneHref || onClone) {
    menuItems.push({
      key: "clone",
      label: cloneLabel,
      href: cloneHref,
      onSelect: onClone,
    });
  }
  if (onDelete) {
    menuItems.push({
      key: "delete",
      label: deleteLabel,
      destructive: true,
      onSelect: onDelete,
    });
  }

  if (isMobile && (menuItems.length > 0 || extra)) {
    return (
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Row actions">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClickCapture={() => setMenuOpen(false)}>
          {menuItems.map((item, index) => (
            <DropdownMenuItem
              key={item.key}
              variant={item.destructive ? "destructive" : "default"}
              className={index > 0 && item.destructive ? "mt-0" : undefined}
              onSelect={item.href ? undefined : () => item.onSelect?.()}
              asChild={Boolean(item.href)}
            >
              {item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </DropdownMenuItem>
          ))}
          {extra ? (
            <>
              <DropdownMenuSeparator />
              <div className="px-1 py-0.5">{extra}</div>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const viewButton = viewHref ? (
    <TableActionTooltip label={viewLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={viewLabel} asChild>
        <Link href={viewHref}>
          <Eye className="size-3.5" />
        </Link>
      </Button>
    </TableActionTooltip>
  ) : onView ? (
    <TableActionTooltip label={viewLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={viewLabel} onClick={onView}>
        <Eye className="size-3.5" />
      </Button>
    </TableActionTooltip>
  ) : null;

  const cloneButton = cloneHref ? (
    <TableActionTooltip label={cloneLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={cloneLabel} asChild>
        <Link href={cloneHref}>
          <Copy className="size-3.5" />
        </Link>
      </Button>
    </TableActionTooltip>
  ) : onClone ? (
    <TableActionTooltip label={cloneLabel}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={cloneLabel}
        onClick={onClone}
      >
        <Copy className="size-3.5" />
      </Button>
    </TableActionTooltip>
  ) : null;

  const editButton = editHref ? (
    <TableActionTooltip label={editLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={editLabel} asChild>
        <Link href={editHref}>
          <Edit2 className="size-3.5" />
        </Link>
      </Button>
    </TableActionTooltip>
  ) : onEdit ? (
    <TableActionTooltip label={editLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={editLabel} onClick={onEdit}>
        <Edit2 className="size-3.5" />
      </Button>
    </TableActionTooltip>
  ) : null;

  return (
    <div className="flex w-max max-w-full gap-0.5">
      {viewButton}
      {editButton}
      {cloneButton}
      {wrapLabeledActions(extra)}
      {onDelete ? (
        <TableActionTooltip label={deleteLabel}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label={deleteLabel}
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TableActionTooltip>
      ) : null}
    </div>
  );
}
