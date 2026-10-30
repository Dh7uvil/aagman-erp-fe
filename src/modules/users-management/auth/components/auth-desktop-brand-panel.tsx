"use client";

import { APP_NAME, ORGANIZATION_NAME } from "@/config/constants";
import { AuthBrandMark } from "@/modules/users-management/auth/components/auth-brand";
import { useAuthBrandingLogo } from "@/modules/users-management/auth/components/auth-org-logo-display";
import { Building2, Lock, ShieldCheck } from "lucide-react";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Authorized access" },
  { icon: Lock, label: "Encrypted sessions" },
  { icon: Building2, label: "Enterprise workspace" },
] as const;

function GradientBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(155deg,#04594c_0%,var(--primary)_48%,#023830_100%)]" />
      <div className="auth-mesh-blob-a absolute -left-20 top-0 size-[420px] rounded-full bg-white/[0.07] blur-[80px]" />
      <div className="auth-mesh-blob-b absolute -right-16 bottom-0 size-[380px] rounded-full bg-[rgb(139_191_60/0.2)] blur-[90px]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.85) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

function DesktopPanelHeroCopy() {
  return (
    <div className="w-full max-w-xl">
      <p className="text-base font-medium uppercase tracking-[0.2em] text-white/65 xl:text-lg">
        Welcome to
      </p>
      <h1 className="mt-3 text-5xl font-semibold leading-[1.08] tracking-tight text-white xl:text-6xl">
        {APP_NAME}
      </h1>
      <p className="mt-4 max-w-lg text-xl leading-relaxed text-white/82 xl:text-2xl">
        Everything your team needs to run {ORGANIZATION_NAME}.
      </p>
    </div>
  );
}

function TrustFooter() {
  return (
    <ul className="flex w-full flex-wrap items-center justify-evenly gap-x-4 gap-y-3 border-t border-white/15 pt-8 text-sm text-white/75">
      {TRUST_ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-white/90" aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function AuthDesktopBrandPanel() {
  const { logoUrl, name, onError } = useAuthBrandingLogo();
  const hasLogo = Boolean(logoUrl);

  return (
    <aside className="relative hidden min-h-svh flex-1 flex-col justify-between overflow-hidden px-10 py-12 xl:px-16 xl:py-14 lg:flex">
      <GradientBackdrop />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {hasLogo ? (
          <>
            <div className="relative h-[30svh] min-h-[7.5rem] max-h-[17.5rem] w-full shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/[0.96] shadow-[0_12px_40px_rgb(0_0_0/0.15)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={name}
                className="absolute inset-0 block size-full max-h-none max-w-none object-fill object-center"
                onError={onError}
              />
            </div>
            <div className="flex min-h-0 flex-1 items-center py-6 xl:py-8">
              <DesktopPanelHeroCopy />
            </div>
          </>
        ) : (
          <AuthBrandMark variant="hero" />
        )}
      </div>

      <div className="relative z-10 shrink-0">
        <TrustFooter />
      </div>
    </aside>
  );
}
