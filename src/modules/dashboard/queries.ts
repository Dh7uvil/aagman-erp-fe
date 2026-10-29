"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/modules/dashboard/api";
import type { DashboardRangeParams } from "@/modules/dashboard/schemas";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  jobs: (params: DashboardRangeParams) => [...dashboardKeys.all, "jobs", params] as const,
  materials: (params: DashboardRangeParams) => [...dashboardKeys.all, "materials", params] as const,
};

export function useJobsDashboard(params: DashboardRangeParams, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.jobs(params),
    queryFn: () => dashboardApi.jobs(params),
    enabled,
  });
}

export function useMaterialsDashboard(params: DashboardRangeParams, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.materials(params),
    queryFn: () => dashboardApi.materials(params),
    enabled,
  });
}
