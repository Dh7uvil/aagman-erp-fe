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

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 overflow-hidden px-2 py-1",
        collapsed ? "justify-center" : "justify-start",
      )}
      aria-label={`${name} home`}
    >
      <TenantLogoMark
        name={name}
        logoUrl={logoUrl}
        className={cn("shrink-0 rounded-lg", collapsed ? "size-8" : "size-9")}
        fallbackClassName="bg-primary"
        iconClassName={collapsed ? "size-4" : "size-5"}
        onLogoError={() => {
          void orgQuery.refetch();
        }}
      />
      {collapsed ? null : (
        <span className="truncate text-sm font-semibold tracking-tight">{name}</span>
      )}
    </Link>
  );
}
