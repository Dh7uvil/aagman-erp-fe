"use client";

import Link from "next/link";

import { APP_NAME } from "@/config/constants";
import { TenantLogoMark } from "@/modules/users-management/organization/components/tenant-logo-mark";
import { useOrganization } from "@/modules/users-management/organization/queries";
import { cn } from "@/shared/lib/cn";

export function OrgSidebarBrand({ collapsed }: { collapsed: boolean }) {
  const orgQuery = useOrganization();
  const name = orgQuery.data?.name ?? APP_NAME;
  const logoUrl = orgQuery.data?.logo_url ?? null;
  const logoRevision = orgQuery.data?.updated_at ?? null;
  const hasLogo = Boolean(logoUrl);

  return (
    <Link
      href="/"
      className={cn(
        "flex min-w-0 items-center justify-center overflow-hidden",
        collapsed ? "py-1" : "h-full flex-1 py-1",
      )}
      aria-label={`${name} home`}
    >
      <TenantLogoMark
        name={name}
        logoUrl={logoUrl}
        revision={logoRevision}
        className={cn(
          "rounded-lg",
          collapsed || !hasLogo
            ? cn("shrink-0", collapsed ? "size-8" : "size-9")
            : "h-12 w-full min-w-0",
        )}
        imageClassName={collapsed || !hasLogo ? undefined : "object-contain object-center"}
        fallbackClassName="bg-primary"
        iconClassName={collapsed ? "size-4" : "size-5"}
        onLogoError={() => {
          void orgQuery.refetch();
        }}
      />
    </Link>
  );
}
