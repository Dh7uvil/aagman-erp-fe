import { APP_NAME } from "@/config/constants";
import { Box, ChartColumn, Truck } from "lucide-react";

const PILLARS = [
  { icon: ChartColumn, label: "Production" },
  { icon: Box, label: "Inventory" },
  { icon: Truck, label: "Dispatch" },
] as const;

const [brandLead, ...brandRest] = APP_NAME.split(" ");
const brandAccent = brandRest.join(" ");

function PanelBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[#064e3f]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/auth/factory.jpg?v=2"
        alt=""
        className="absolute inset-0 size-full min-h-full min-w-full scale-[1.04] object-cover object-[32%_62%] brightness-[0.9] contrast-[1.06] saturate-[0.4]"
      />
      <div className="absolute inset-0 bg-[#117a64]/80 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[linear-gradient(168deg,rgb(5_74_60/0.7)_0%,rgb(11_120_98/0.2)_45%,rgb(3_54_44/0.65)_100%)]" />

      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 1000 1100"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-220 -80C 260 40 180 560 -120 1200"
          fill="none"
          stroke="white"
          strokeOpacity="0.16"
          strokeWidth="150"
        />
        <path
          d="M-60 -40C 380 140 300 640 20 1180"
          fill="none"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />
        <path
          d="M620 1080C 860 860 1080 980 1200 1120"
          fill="none"
          stroke="white"
          strokeOpacity="0.12"
          strokeWidth="90"
        />
      </svg>

      <div
        className="absolute top-10 left-10 h-20 w-24 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(255 255 255 / 0.9) 1.05px, transparent 1.15px)",
          backgroundSize: "9px 9px",
        }}
      />
    </div>
  );
}

function BrandCopy() {
  return (
    <div className="max-w-xl">
      <div className="mb-6 h-[3px] w-10 rounded-full bg-white" />
      <h1 className="text-[3.15rem] leading-none font-bold tracking-tight text-white xl:text-[4.25rem]">
        {brandLead}
        {brandAccent ? (
          <>
            {" "}
            <span className="font-semibold text-[#c8f3d8]">{brandAccent}</span>
          </>
        ) : null}
      </h1>
      <p className="mt-5 text-lg font-medium tracking-wide text-white/90 xl:text-xl">
        Manage. Track. Grow.
      </p>
    </div>
  );
}

function PillarFooter() {
  return (
    <ul className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-y-3 text-sm text-white/90">
      {PILLARS.map(({ icon: Icon, label }, index) => (
        <li key={label} className="flex items-center">
          {index > 0 ? (
            <span className="mr-6 h-4 w-px bg-white/35 xl:mr-8" aria-hidden="true" />
          ) : null}
          <span className="flex items-center gap-2">
            <Icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AuthDesktopBrandPanel() {
  return (
    <aside className="relative hidden min-h-svh w-[56%] shrink-0 flex-col overflow-hidden lg:flex xl:w-[58%]">
      <PanelBackdrop />

      <div className="relative z-10 flex min-h-0 flex-1 items-center px-12 pb-16 xl:px-20 xl:pb-24">
        <BrandCopy />
      </div>

      <div className="relative z-10 shrink-0 px-12 pb-9 xl:px-16 xl:pb-11">
        <PillarFooter />
      </div>
    </aside>
  );
}
