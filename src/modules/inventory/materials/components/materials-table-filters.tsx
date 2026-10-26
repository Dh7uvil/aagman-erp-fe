"use client";

import { useMemo, useState } from "react";

import { ActiveFilterPills, type ActiveFilterPill } from "@/shared/components/data-table/filter-chip";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { sortFilterPillLabel } from "@/shared/components/data-table/sort-filter-label";
import type { SortFieldOption } from "@/shared/components/data-table/sort";
import { Input } from "@/shared/components/ui/input";
import {
  LIST_ACTIVE_ACTIVE,
  LIST_ACTIVE_ALL,
  LIST_ACTIVE_INACTIVE,
  listActiveFilterValue,
} from "@/shared/lib/list-filters";
import { useTableParams } from "@/shared/hooks/use-table-params";

type ExtraFilters = {
  size: string;
  rolls: string;
  kgLt: string;
  kgGt: string;
  active: string;
};

const EMPTY_EXTRA: ExtraFilters = {
  size: "",
  rolls: "",
  kgLt: "",
  kgGt: "",
  active: LIST_ACTIVE_ACTIVE,
};

function extraFromUrl(filters: Record<string, string>): ExtraFilters {
  return {
    size: filters.size ?? "",
    rolls: filters.rolls ?? "",
    kgLt: filters.kg_lt ?? "",
    kgGt: filters.kg_gt ?? "",
    active: listActiveFilterValue(filters.active),
  };
}

function optionalDecimal(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function extraToUrlPatch(extra: ExtraFilters): Record<string, string | null> {
  return {
    size: optionalDecimal(extra.size) ?? null,
    rolls: optionalDecimal(extra.rolls) ?? null,
    kg_lt: optionalDecimal(extra.kgLt) ?? null,
    kg_gt: optionalDecimal(extra.kgGt) ?? null,
    active: extra.active === LIST_ACTIVE_ACTIVE ? null : extra.active,
  };
}

function extraFilterCount(extra: ExtraFilters): number {
  return [
    optionalDecimal(extra.size),
    optionalDecimal(extra.rolls),
    optionalDecimal(extra.kgLt),
    optionalDecimal(extra.kgGt),
    extra.active !== LIST_ACTIVE_ACTIVE,
  ].filter(Boolean).length;
}

export function materialsExtraFilterCount(filters: Record<string, string>): number {
  return extraFilterCount(extraFromUrl(filters));
}

export function materialsListQueryFromFilters(filters: Record<string, string>) {
  const extra = extraFromUrl(filters);
  return {
    size: optionalDecimal(extra.size),
    rolls: optionalDecimal(extra.rolls),
    kg_lt: optionalDecimal(extra.kgLt),
    kg_gt: optionalDecimal(extra.kgGt),
  };
}

function listActiveStatusLabel(value: string): string {
  if (value === LIST_ACTIVE_INACTIVE) {
    return "Inactive";
  }
  if (value === LIST_ACTIVE_ALL) {
    return "All statuses";
  }
  return "Active";
}

export function MaterialsActiveFilterPills({
  productName,
  micronName,
  sortFields,
  onClearAll,
}: {
  productName?: string;
  micronName?: string;
  sortFields: readonly SortFieldOption[];
  onClearAll?: () => void;
}) {
  const { search, sort_by, sort_order, filters, setParams } = useTableParams();
  const productId = filters.product_id;
  const micronId = filters.parent_id;
  const extra = extraFromUrl(filters);

  const pills = useMemo(() => {
    const next: ActiveFilterPill[] = [];

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      next.push({
        id: "search",
        label: `Search: ${trimmedSearch}`,
        onRemove: () => setParams({ search: null }),
      });
    }

    if (productId) {
      next.push({
        id: "product",
        label: `Product: ${productName ?? productId}`,
        onRemove: () =>
          setParams({
            filters: { product_id: null, parent_id: null },
          }),
      });
    }

    if (productId && micronId) {
      next.push({
        id: "micron",
        label: `Micron: ${micronName ?? micronId}`,
        onRemove: () => setParams({ filters: { parent_id: null } }),
      });
    }

    const size = optionalDecimal(extra.size);
    if (size) {
      next.push({
        id: "size",
        label: `Size: ${size}`,
        onRemove: () => setParams({ filters: extraToUrlPatch({ ...extra, size: "" }) }),
      });
    }

    const rolls = optionalDecimal(extra.rolls);
    if (rolls) {
      next.push({
        id: "rolls",
        label: `Rolls: ${rolls}`,
        onRemove: () => setParams({ filters: extraToUrlPatch({ ...extra, rolls: "" }) }),
      });
    }

    const kgLt = optionalDecimal(extra.kgLt);
    if (kgLt) {
      next.push({
        id: "kg_lt",
        label: `Kg < ${kgLt}`,
        onRemove: () => setParams({ filters: extraToUrlPatch({ ...extra, kgLt: "" }) }),
      });
    }

    const kgGt = optionalDecimal(extra.kgGt);
    if (kgGt) {
      next.push({
        id: "kg_gt",
        label: `Kg > ${kgGt}`,
        onRemove: () => setParams({ filters: extraToUrlPatch({ ...extra, kgGt: "" }) }),
      });
    }

    if (extra.active !== LIST_ACTIVE_ACTIVE) {
      next.push({
        id: "active",
        label: `Status: ${listActiveStatusLabel(extra.active)}`,
        onRemove: () => setParams({ filters: extraToUrlPatch({ ...extra, active: LIST_ACTIVE_ACTIVE }) }),
      });
    }

    const sortLabel = sortFilterPillLabel(sort_by, sort_order, sortFields);
    if (sortLabel) {
      next.push({
        id: "sort",
        label: sortLabel,
        onRemove: () => setParams({ sort_by: null, sort_order: null }),
      });
    }

    return next;
  }, [
    extra,
    micronId,
    micronName,
    productId,
    productName,
    search,
    setParams,
    sortFields,
    sort_by,
    sort_order,
  ]);

  return <ActiveFilterPills pills={pills} onClearAll={onClearAll} />;
}

export function MaterialsTableMoreFilters() {
  const { filters, setParams } = useTableParams();
  const extraFilters = extraFromUrl(filters);
  const [draftExtra, setDraftExtra] = useState<ExtraFilters>(EMPTY_EXTRA);

  const extraCount = extraFilterCount(extraFilters);

  return (
    <MoreFiltersDialog
        extraCount={extraCount}
        draftCount={extraFilterCount(draftExtra)}
        description="Filter materials by size, stock levels, and status."
        contentClassName="sm:max-w-lg"
        onOpen={() => setDraftExtra(extraFilters)}
        onApply={() => setParams({ filters: extraToUrlPatch(draftExtra) })}
        onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
      >
        <FilterField label="Size" htmlFor="material-filter-size">
          <Input
            id="material-filter-size"
            inputMode="decimal"
            placeholder="Exact width"
            value={draftExtra.size}
            onChange={(event) => setDraftExtra((current) => ({ ...current, size: event.target.value }))}
          />
        </FilterField>
        <FilterField label="No. of rolls" htmlFor="material-filter-rolls">
          <Input
            id="material-filter-rolls"
            inputMode="decimal"
            placeholder="Exact rolls on hand"
            value={draftExtra.rolls}
            onChange={(event) => setDraftExtra((current) => ({ ...current, rolls: event.target.value }))}
          />
        </FilterField>
        <FilterField label="Kg less than" htmlFor="material-filter-kg-lt">
          <Input
            id="material-filter-kg-lt"
            inputMode="decimal"
            placeholder="Total kg below"
            value={draftExtra.kgLt}
            onChange={(event) => setDraftExtra((current) => ({ ...current, kgLt: event.target.value }))}
          />
        </FilterField>
        <FilterField label="Kg greater than" htmlFor="material-filter-kg-gt">
          <Input
            id="material-filter-kg-gt"
            inputMode="decimal"
            placeholder="Total kg above"
            value={draftExtra.kgGt}
            onChange={(event) => setDraftExtra((current) => ({ ...current, kgGt: event.target.value }))}
          />
        </FilterField>
        <FilterField label="Status" htmlFor="material-filter-status">
          <FilterSelect
            id="material-filter-status"
            className="w-full"
            placeholder="Status"
            value={draftExtra.active}
            onValueChange={(value) => setDraftExtra((current) => ({ ...current, active: value }))}
            options={[
              { value: LIST_ACTIVE_ACTIVE, label: "Active" },
              { value: LIST_ACTIVE_INACTIVE, label: "Inactive" },
              { value: LIST_ACTIVE_ALL, label: "All statuses" },
            ]}
          />
        </FilterField>
    </MoreFiltersDialog>
  );
}
