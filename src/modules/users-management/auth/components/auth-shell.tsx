import type { ReactNode } from "react";

import { AuthDesktopBrandPanel } from "@/modules/users-management/auth/components/auth-desktop-brand-panel";

const dotGridStyle = {
  backgroundImage: "radial-gradient(circle, rgb(156 176 168 / 0.85) 1.05px, transparent 1.15px)",
  backgroundSize: "8px 8px",
} as const;

function RightPanelDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-28 -left-24 h-[28rem] w-[26rem] rounded-full bg-white/80" />
      <div className="absolute right-[-6rem] bottom-[-8rem] h-[24rem] w-[24rem] rounded-full bg-white/70" />
      <div className="absolute top-6 -right-16 h-72 w-72 rounded-full border border-white/80" />
      <div className="absolute top-8 right-8 h-14 w-16 opacity-70" style={dotGridStyle} />
      <div className="absolute right-10 bottom-16 h-20 w-14 opacity-60" style={dotGridStyle} />
    </div>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page relative flex min-h-svh w-full min-w-0 touch-manipulation flex-col lg:flex-row">
      <AuthDesktopBrandPanel />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#eef6f2] lg:min-h-svh">
        <RightPanelDecor />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-4 py-8 sm:px-8 max-lg:h-dvh max-lg:max-h-dvh max-lg:overflow-y-auto max-lg:overscroll-y-contain max-lg:pt-[max(1.25rem,env(safe-area-inset-top,0px))] max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
          <div className="mx-auto w-full max-w-[440px]">
            <div className="rounded-[1.35rem] bg-white px-6 py-8 shadow-[0_18px_50px_rgb(16_42_34/0.08)] sm:px-10 sm:py-11">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
