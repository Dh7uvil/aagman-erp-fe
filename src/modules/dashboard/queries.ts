"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/modules/dashboard/api";
import type { DashboardRangeParams } from "@/modules/dashboard/schemas";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  cylinders: (params: DashboardRangeParams) => [...dashboardKeys.all, "cylinders", params] as const,
  materials: (params: DashboardRangeParams) => [...dashboardKeys.all, "materials", params] as const,
  inks: (params: DashboardRangeParams) => [...dashboardKeys.all, "inks", params] as const,
  adhesives: (params: DashboardRangeParams) => [...dashboardKeys.all, "adhesives", params] as const,
  solvents: (params: DashboardRangeParams) => [...dashboardKeys.all, "solvents", params] as const,
};

export function useCylindersDashboard(params: DashboardRangeParams, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.cylinders(params),
    queryFn: () => dashboardApi.cylinders(params),
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

export function useInksDashboard(params: DashboardRangeParams, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.inks(params),
    queryFn: () => dashboardApi.inks(params),
    enabled,
  });
}

export function useAdhesivesDashboard(params: DashboardRangeParams, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.adhesives(params),
    queryFn: () => dashboardApi.adhesives(params),
    enabled,
  });
}

export function useSolventsDashboard(params: DashboardRangeParams, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.solvents(params),
    queryFn: () => dashboardApi.solvents(params),
    enabled,
  });
}
