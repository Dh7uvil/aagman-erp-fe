"use client";

import { APP_NAME } from "@/config/constants";
import { TenantLogoMark } from "@/modules/users-management/organization/components/tenant-logo-mark";
import { useOrganization } from "@/modules/users-management/organization/queries";
import { useIsClient } from "@/shared/hooks/use-is-client";

export function AuthBrandMark({ compact = false }: { compact?: boolean }) {
  const orgQuery = useOrganization();
  const isClient = useIsClient();
  const name = isClient ? (orgQuery.data?.name ?? APP_NAME) : APP_NAME;
  const logoUrl = isClient ? (orgQuery.data?.logo_url ?? null) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <TenantLogoMark
          name={name}
          logoUrl={logoUrl}
          className="size-12 rounded-xl"
          fallbackClassName="bg-primary"
          iconClassName="size-6"
          onLogoError={() => {
            void orgQuery.refetch();
          }}
        />
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-semibold tracking-tight">{name}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex size-32 items-center justify-center overflow-hidden rounded-2xl bg-white/15">
        <TenantLogoMark
          name={name}
          logoUrl={logoUrl}
          className="size-32 rounded-2xl"
          imageClassName="bg-background object-contain p-1"
          fallbackClassName="bg-transparent"
          iconClassName="text-primary-foreground size-16"
          onLogoError={() => {
            void orgQuery.refetch();
          }}
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
    </>
  );
}
