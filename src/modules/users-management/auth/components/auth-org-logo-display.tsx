"use client";

import { APP_NAME } from "@/config/constants";
import { useAuthOrganizationBranding } from "@/modules/users-management/auth/queries";
import { TenantLogoMark } from "@/modules/users-management/organization/components/tenant-logo-mark";
import { cn } from "@/shared/lib/cn";
import { toDisplayLogoUrl } from "@/shared/lib/logo-url";

function resolveBrandingLogoUrl(logoUrl: string | null | undefined): string | undefined {
  if (!logoUrl) {
    return undefined;
  }
  if (logoUrl.startsWith("/")) {
    return logoUrl;
  }
  return toDisplayLogoUrl(logoUrl);
}

export function useAuthBrandingLogo() {
  const brandingQuery = useAuthOrganizationBranding();
  const name = brandingQuery.data?.name ?? APP_NAME;
  const logoUrl = resolveBrandingLogoUrl(brandingQuery.data?.logo_url);

  return {
    name,
    logoUrl,
    isLoading: brandingQuery.isLoading,
    onError: () => {
      void brandingQuery.refetch();
    },
  };
}

export function useAuthBrandingHasLogo() {
  const { logoUrl } = useAuthBrandingLogo();
  return Boolean(logoUrl);
}

const LOGO_SIZE = {
  sm: "h-9 max-w-[9.5rem] sm:h-10 sm:max-w-[11rem]",
  md: "h-11 max-w-[12rem] sm:h-12 sm:max-w-[14rem]",
  lg: "h-14 max-w-[16rem] sm:h-16 sm:max-w-[18rem]",
  panel: "h-12 max-w-[13rem] xl:h-14 xl:max-w-[15rem]",
} as const;

type AuthOrganizationLogoProps = {
  size?: keyof typeof LOGO_SIZE;
  className?: string;
  /** Zap fallback mark when no upload (hidden when false and no logo). */
  showFallback?: boolean;
  fallbackMarkClassName?: string;
  onDark?: boolean;
};

/** Org logo or primary Zap mark — sized for auth headers, no heavy frames. */
export function AuthOrganizationLogo({
  size = "md",
  className,
  showFallback = true,
  fallbackMarkClassName,
  onDark = false,
}: AuthOrganizationLogoProps) {
  const { name, logoUrl, onError } = useAuthBrandingLogo();

  if (logoUrl) {
    if (onDark && size === "panel") {
      return (
        <div className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgb(0_0_0/0.12)] ring-1 ring-white/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={logoUrl}
            src={logoUrl}
            alt={name}
            className={cn("w-auto shrink-0 object-contain", LOGO_SIZE[size], className)}
            onError={onError}
          />
        </div>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={logoUrl}
        src={logoUrl}
        alt={name}
        className={cn("w-auto shrink-0 object-contain", LOGO_SIZE[size], className)}
        onError={onError}
      />
    );
  }

  if (!showFallback) {
    return null;
  }

  return (
    <TenantLogoMark
      name={name}
      logoUrl={null}
      className={cn(
        "size-11 shrink-0 rounded-xl shadow-sm",
        onDark ? "ring-1 ring-white/25" : "ring-1 ring-primary/10",
        fallbackMarkClassName,
      )}
      fallbackClassName={onDark ? "bg-white/15" : "bg-primary"}
      iconClassName={cn("size-5", onDark && "text-white")}
      onLogoError={onError}
    />
  );
}
