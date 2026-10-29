"use client";

import { MoreHorizontal } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { useDropdownMenuNavigationSync } from "@/shared/hooks/use-dropdown-menu-navigation-sync";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/cn";

function headerCodeTooltip(codeLabel?: string, codeTooltip?: string): string {
  if (codeTooltip) {
    return codeTooltip;
  }
  if (codeLabel) {
    return `${codeLabel} ID`;
  }
  return "ID";
}

function PageHeaderCode({
  code,
  codeLabel,
  codeTooltip,
}: {
  code: string;
  codeLabel?: string;
  codeTooltip?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground cursor-default font-mono text-sm underline decoration-dotted underline-offset-4">
          {code}
        </span>
      </TooltipTrigger>
      <TooltipContent>{headerCodeTooltip(codeLabel, codeTooltip)}</TooltipContent>
    </Tooltip>
  );
}

function buttonLabel(element: ReactElement): string | null {
  const props = element.props as { children?: ReactNode };
  const child = props.children;
  if (typeof child === "string") {
    return child.trim();
  }
  if (isValidElement(child)) {
    const inner = (child.props as { children?: ReactNode }).children;
    if (typeof inner === "string") {
      return inner.trim();
    }
  }
  return null;
}

function isPersistHeaderAction(element: ReactElement): boolean {
  if (element.type !== Button) {
    return false;
  }
  const props = element.props as Record<string, unknown>;
  if (props["data-page-header-persist"]) {
    return true;
  }
  const label = buttonLabel(element);
  return label === "Back" || label === "Cancel" || label === "Back to record";
}

function collectActionButtons(node: ReactNode): ReactElement[] {
  const buttons: ReactElement[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) {
      return;
    }
    if (child.type === Fragment) {
      buttons.push(...collectActionButtons((child.props as { children?: ReactNode }).children));
      return;
    }
    if (child.type === Button) {
      buttons.push(child);
      return;
    }
    const props = child.props as { children?: ReactNode };
    if (props.children) {
      buttons.push(...collectActionButtons(props.children));
    }
  });
  return buttons;
}

function renderHeaderButtons(buttons: readonly ReactElement[]): ReactNode {
  return buttons.map((button, index) =>
    cloneElement(button, { key: button.key ?? `page-header-action-${index}` }),
  );
}

function PageHeaderActions({ actions }: { actions: ReactNode }) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useDropdownMenuNavigationSync();
  const buttons = collectActionButtons(actions);
  const persistActions = buttons.filter(isPersistHeaderAction);
  const menuActions = buttons.filter((button) => !isPersistHeaderAction(button));
  const collapse = isMobile && menuActions.length >= 3;

  if (!collapse) {
    return (
      <div
        data-page-actions
        className={cn("flex shrink-0 flex-wrap items-center justify-end gap-2")}
      >
        {actions}
      </div>
    );
  }

  return (
    <>
      <div
        data-page-actions
        className={cn("hidden shrink-0 flex-wrap items-center gap-2 sm:flex")}
      >
        {actions}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 sm:hidden">
        {renderHeaderButtons(persistActions)}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <MoreHorizontal className="size-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="flex w-56 flex-col gap-1 p-2"
            onClickCapture={() => setMenuOpen(false)}
          >
            {renderHeaderButtons(menuActions)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export function PageHeader({
  title,
  subtitle,
  code,
  codeLabel,
  codeTooltip,
  badges,
  actions,
  mobileHeaderActions,
  mobileSecondaryActions,
}: {
  title: string;
  subtitle?: string;
  code?: string | null;
  codeLabel?: string;
  codeTooltip?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  /** On mobile, show only these in the title row (e.g. Back). Desktop uses `actions`. */
  mobileHeaderActions?: ReactNode;
  /** On mobile, full-width row below the subtitle (e.g. Clone, New, Edit). */
  mobileSecondaryActions?: ReactNode;
}) {
  const isMobile = useIsMobile();
  const splitMobileActions = Boolean(isMobile && mobileHeaderActions != null);
  const headerActions = splitMobileActions ? mobileHeaderActions : actions;

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-lg font-semibold tracking-tight">{title}</h1>
            {code && code !== title ? (
              <PageHeaderCode code={code} codeLabel={codeLabel} codeTooltip={codeTooltip} />
            ) : null}
            {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
          </div>
        </div>
        {headerActions ? (
          <div className="flex shrink-0 justify-end">
            <PageHeaderActions actions={headerActions} />
          </div>
        ) : null}
      </div>
      {subtitle ? (
        <p className="text-muted-foreground min-w-0 text-sm leading-snug">{subtitle}</p>
      ) : null}
      {splitMobileActions && mobileSecondaryActions ? (
        <div className="flex w-full gap-2 sm:hidden [&_[data-slot=button]]:min-w-0 [&_[data-slot=button]]:flex-1 [&_a]:min-w-0">
          {mobileSecondaryActions}
        </div>
      ) : null}
    </div>
  );
}
