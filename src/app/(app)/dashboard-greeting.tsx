"use client";

function partOfDay(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) {
    return "morning";
  }
  if (hour < 17) {
    return "afternoon";
  }
  return "evening";
}

export function DashboardGreeting({ name }: { name: string }) {
  const part = partOfDay(new Date().getHours());

  return (
    <h1
      suppressHydrationWarning
      className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl"
    >
      Good {part}, {name}
    </h1>
  );
}
