"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useCylinders } from "@/modules/inventory/cylinders/queries";
import { cylinderRoutes } from "@/modules/inventory/cylinders/routes";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/shared/components/form/searchable-select";
import { CancelLabel, ContinueLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

function toCylinderOption(cylinder: {
  id: string;
  cylinder_number: string;
  product_name: string;
  status: string;
}): SearchableSelectOption {
  return {
    value: cylinder.id,
    label: `${cylinder.cylinder_number} — ${cylinder.product_name} (${cylinder.status})`,
    triggerLabel: cylinder.cylinder_number,
  };
}

export function CylinderCloneDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [cylinderId, setCylinderId] = useState("");
  const [search, setSearch] = useState("");
  const [pinnedOption, setPinnedOption] = useState<SearchableSelectOption | null>(null);

  const cylindersQuery = useCylinders(
    {
      page: 1,
      page_size: 100,
      search: search || undefined,
      include_closed: true,
    },
    open,
  );

  const jobOptions = useMemo(() => {
    const mapped = (cylindersQuery.data?.data ?? []).map(toCylinderOption);
    if (pinnedOption && !mapped.some((option) => option.value === pinnedOption.value)) {
      return [pinnedOption, ...mapped];
    }
    return mapped;
  }, [cylindersQuery.data?.data, pinnedOption]);

  useEffect(() => {
    if (!open) {
      setCylinderId("");
      setSearch("");
      setPinnedOption(null);
    }
  }, [open]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  function handleCylinderChange(nextId: string) {
    setCylinderId(nextId);
    const option = jobOptions.find((row) => row.value === nextId);
    if (option) {
      setPinnedOption(option);
    }
  }

  function continueClone() {
    if (!cylinderId) {
      return;
    }
    onOpenChange(false);
    router.push(cylinderRoutes.clone(cylinderId));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent mobileSheet className="sm:max-w-[min(28rem,calc(100vw-1.5rem))]">
        <DialogHeader>
          <DialogTitle>Clone cylinder</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Choose a cylinder to copy. You will get a new cylinder number; documents are not copied.
        </p>
        <SearchableSelect
          asFormControl={false}
          searchable
          aria-label="Job to clone"
          placeholder="Select cylinder"
          searchPlaceholder="Search cylinder number or product…"
          emptyText={cylindersQuery.isError ? "Could not load jobs" : "No cylinders found"}
          options={jobOptions}
          value={cylinderId}
          onValueChange={handleCylinderChange}
          onQueryChange={setSearch}
          loading={cylindersQuery.isFetching}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            <CancelLabel />
          </Button>
          <Button type="button" disabled={!cylinderId} onClick={continueClone}>
            <ContinueLabel />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
