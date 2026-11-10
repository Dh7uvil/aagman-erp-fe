"use client";

import { APP_NAME, ORGANIZATION_NAME } from "@/config/constants";
import {
  AuthOrganizationLogo,
  useAuthBrandingHasLogo,
} from "@/modules/users-management/auth/components/auth-org-logo-display";
import { useAuthOrganizationBranding } from "@/modules/users-management/auth/queries";
import { useIsClient } from "@/shared/hooks/use-is-client";
import { cn } from "@/shared/lib/cn";

type AuthBrandVariant = "compact" | "hero" | "mobile";

export function AuthBrandMark({
  compact = false,
  variant,
  className,
}: {
  compact?: boolean;
  variant?: AuthBrandVariant;
  className?: string;
}) {
  const resolvedVariant: AuthBrandVariant = variant ?? (compact ? "compact" : "hero");
  const brandingQuery = useAuthOrganizationBranding();
  const isClient = useIsClient();

  const orgName = isClient ? (brandingQuery.data?.name ?? ORGANIZATION_NAME) : ORGANIZATION_NAME;
  const hasUploadedLogo = useAuthBrandingHasLogo();

  if (resolvedVariant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <AuthOrganizationLogo size="sm" showFallback />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold tracking-tight">{APP_NAME}</p>
          <p className="text-muted-foreground text-xs">Sign in to continue</p>
        </div>
      </div>
    );
  }

  if (resolvedVariant === "mobile") {
    return (
      <div className={cn("flex flex-col items-center gap-2.5 text-center", className)}>
        <AuthOrganizationLogo size="md" showFallback className="object-center" />
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-[0.6875rem] font-medium uppercase tracking-[0.14em]">
            Welcome to
          </p>
          <h1 className="text-foreground text-[1.625rem] font-semibold leading-tight tracking-tight sm:text-3xl">
            {APP_NAME}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex max-w-md flex-col gap-5", className)}>
      {!hasUploadedLogo ? (
        <AuthOrganizationLogo size="panel" showFallback onDark />
      ) : null}
      <div className="flex flex-col gap-4">
        <p className="text-base font-medium uppercase tracking-[0.2em] text-white/65 xl:text-lg">
          Welcome to
        </p>
        <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
          {APP_NAME}
        </h1>
        <p className="max-w-lg text-xl leading-relaxed text-white/82 xl:text-2xl">
          Everything your team needs to run {ORGANIZATION_NAME}.
        </p>
        {orgName !== ORGANIZATION_NAME ? (
          <p className="text-sm leading-snug text-white/60">{orgName}</p>
        ) : null}
      </div>
    </div>
  );
}
