import type { ReactNode } from "react";

import { ORGANIZATION_NAME } from "@/config/constants";
import { AuthBrandMark } from "@/modules/users-management/auth/components/auth-brand";
import { AuthDesktopBrandPanel } from "@/modules/users-management/auth/components/auth-desktop-brand-panel";

function MobileBrandHeader() {
  return (
    <header className="w-full shrink-0 lg:hidden">
      <AuthBrandMark variant="mobile" />
      <p className="text-muted-foreground mx-auto mt-2 max-w-xs text-center text-xs leading-snug sm:text-sm">
        Everything your team needs to run {ORGANIZATION_NAME}.
      </p>
    </header>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page relative flex min-h-svh w-full min-w-0 touch-manipulation flex-col lg:flex-row lg:min-h-svh">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--primary)_6%,var(--background))_100%)] lg:hidden"
        aria-hidden="true"
      />

      <AuthDesktopBrandPanel />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-svh lg:bg-muted/35">
        <div className="flex min-h-0 flex-1 flex-col px-4 sm:px-6 lg:justify-center lg:px-10 lg:py-10 max-lg:h-dvh max-lg:max-h-dvh max-lg:overflow-y-auto max-lg:overscroll-y-contain max-lg:pt-[max(0.75rem,env(safe-area-inset-top,0px))] max-lg:pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3 max-lg:min-h-0 max-lg:flex-1 sm:gap-4 lg:max-w-[440px] lg:gap-8">
            <MobileBrandHeader />

            <div className="flex min-h-0 flex-1 flex-col justify-center max-lg:justify-start max-lg:pb-1">
              <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-sm sm:p-6 lg:rounded-2xl lg:p-9 lg:shadow-[0_8px_30px_rgb(0_0_0/0.06)]">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
