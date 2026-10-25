"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { companiesApi } from "@/modules/users-management/companies/api";
import type { CompanyListParams } from "@/modules/users-management/companies/schemas";

export const companyKeys = {
  all: ["companies"] as const,
  list: (params: CompanyListParams) => [...companyKeys.all, "list", params] as const,
  detail: (id: string) => [...companyKeys.all, "detail", id] as const,
};

export function useCompanies(params: CompanyListParams) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => companiesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCompany(id: string | null) {
  return useQuery({
    queryKey: companyKeys.detail(id ?? ""),
    queryFn: () => companiesApi.get(id!),
    enabled: Boolean(id),
  });
}
