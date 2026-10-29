"use client";

import { Copy } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { syncCountToRows } from "@/modules/inventory/jobs/lib/sync-count-rows";
import {
  JobFileSlots,
  JobFileSlotsPlaceholder,
} from "@/modules/inventory/jobs/components/job-file-slots";
import {
  jobFormStatusOptions,
  type Job,
  type JobFormValues,
} from "@/modules/inventory/jobs/schemas";
import { CompanyQuickCreateDialog } from "@/modules/users-management/companies/components/company-quick-create-dialog";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { MasterSelect } from "@/shared/components/form/master-select";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import {
  FormControl,
  FormField,
  FormGrid,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatFixedDecimal, multiplyDecimals } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";
import { jobPricePermissions } from "@/modules/inventory/permissions";

function JobFormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      {title ? <h3 className="text-sm font-semibold tracking-tight">{title}</h3> : null}
      {children}
    </section>
  );
}

/** 1 → full width; 2 → two columns; 3+ → three columns max (extra rows wrap). */
function colorLinesGridClass(count: number): string {
  if (count <= 1) {
    return "grid grid-cols-1 gap-3";
  }
  if (count === 2) {
    return "grid grid-cols-1 gap-3 sm:grid-cols-2";
  }
  return "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";
}

export function JobFormFields({
  control,
  readOnly,
  setValue,
  job,
}: {
  control: Control<JobFormValues>;
  readOnly?: boolean;
  setValue: UseFormSetValue<JobFormValues>;
  job?: Job | null;
}) {
  const can = useCan();
  const canViewPrice = can(jobPricePermissions.read);
  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];
  const canCreateCompany = can(companyPermissions.create);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  const cylinderCount = useWatch({ control, name: "cylinder_count" });
  const colorCount = useWatch({ control, name: "color_count" });
  const cylinderCost = useWatch({ control, name: "cylinder_cost" });
  const sizeLines = useFieldArray({ control, name: "size_lines" });
  const colorLines = useFieldArray({ control, name: "color_lines" });
  const sizeLinesValues = useWatch({ control, name: "size_lines" });
  const statusValue = useWatch({ control, name: "status" });
  const statusOptions = jobFormStatusOptions(job?.status ?? statusValue);

  function copyFirstCylinderDimensionsToAll() {
    const lines = sizeLinesValues ?? [];
    const first = lines[0];
    if (!first || lines.length <= 1) {
      return;
    }
    setValue(
      "size_lines",
      lines.map((line, index) =>
        index === 0 ? line : { width: first.width, circumference: first.circumference },
      ),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  const totalCylinderCost = useMemo(() => {
    if (!canViewPrice) {
      return null;
    }
    const count = String(cylinderCount ?? "").trim();
    const cost = String(cylinderCost ?? "").trim();
    if (!count || !cost) {
      return null;
    }
    return multiplyDecimals(cost, count);
  }, [canViewPrice, cylinderCost, cylinderCount]);

  useEffect(() => {
    const count = Number(cylinderCount) || 0;
    if (count < 1 || count > 50) {
      return;
    }
    const synced = syncCountToRows(count, sizeLines.fields, () => ({
      width: "",
      circumference: "",
    }));
    if (synced.length !== sizeLines.fields.length) {
      setValue("size_lines", synced);
    }
  }, [cylinderCount, setValue, sizeLines.fields.length]);

  useEffect(() => {
    const count = Number(colorCount) || 0;
    if (count < 0 || count > 50) {
      return;
    }
    const synced = syncCountToRows(count, colorLines.fields, () => ({ name: "" }));
    if (synced.length !== colorLines.fields.length) {
      setValue("color_lines", synced);
    }
  }, [colorCount, setValue, colorLines.fields.length]);

  return (
    <div className="flex flex-col gap-5">
      <JobFormSection>
        <FormGrid columns={3}>
          <FormField
            control={control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={readOnly}
                    placeholder="Select company"
                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    createLabel={!readOnly && canCreateCompany ? "Add company" : undefined}
                    onCreate={
                      !readOnly && canCreateCompany ? () => setCompanyDialogOpen(true) : undefined
                    }
                    loading={companiesQuery.isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="product_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  disabled={readOnly}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormGrid>
      </JobFormSection>

      <JobFormSection title="Cylinders">
        <FormGrid columns={3}>
          <FormField
            control={control}
            name="cylinder_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. of cylinders</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={50} {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="cylinder_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cylinder location</FormLabel>
                <FormControl>
                  <Input {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="pet_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pet size</FormLabel>
                <FormControl>
                  <Input {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormGrid>

        {canViewPrice ? (
          <FormGrid columns={2}>
            <FormField
              control={control}
              name="cylinder_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cylinder cost</FormLabel>
                  <FormControl>
                    <DecimalInput kind="money" {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Total cylinder cost</FormLabel>
              <p className="text-muted-foreground pt-2 text-sm leading-relaxed tabular-nums">
                {String(cylinderCost ?? "").trim() && String(cylinderCount ?? "").trim() ? (
                  <>
                    {formatFixedDecimal(String(cylinderCost).trim(), 2)} × {cylinderCount} no. of
                    cylinders ={" "}
                    <span className="text-foreground font-medium">
                      {totalCylinderCost != null
                        ? formatFixedDecimal(totalCylinderCost, 2)
                        : "—"}
                    </span>{" "}
                    Total cylinder cost
                  </>
                ) : (
                  "Enter cylinder cost and no. of cylinders"
                )}
              </p>
            </FormItem>
          </FormGrid>
        ) : null}

        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Cylinder dimensions</p>
            {!readOnly && sizeLines.fields.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={copyFirstCylinderDimensionsToAll}
              >
                <Copy className="size-3.5" />
                Copy to all rows
              </Button>
            ) : null}
          </div>
          <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-3 sm:px-1">
            <span className="text-muted-foreground text-xs">#</span>
            <span className="text-muted-foreground text-xs">Width</span>
            <span aria-hidden className="text-xs" />
            <span className="text-muted-foreground text-xs">Circumference</span>
          </div>
          {sizeLines.fields.map((line, index) => (
            <div
              key={line.id}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto_1fr] sm:items-start"
            >
              <span className="text-muted-foreground flex h-9 items-center text-sm">
                {index + 1}.
              </span>
              <FormField
                control={control}
                name={`size_lines.${index}.width`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sm:sr-only">Width</FormLabel>
                    <FormControl>
                      <DecimalInput kind="quantity" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <span
                aria-hidden
                className="text-muted-foreground flex h-9 w-4 shrink-0 items-center justify-center self-center text-sm sm:self-start"
              >
                ×
              </span>
              <FormField
                control={control}
                name={`size_lines.${index}.circumference`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sm:sr-only">Circumference</FormLabel>
                    <FormControl>
                      <DecimalInput kind="quantity" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </JobFormSection>

      <JobFormSection title="Colours">
        <FormField
          control={control}
          name="color_count"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>No. of colours</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={50} {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {colorLines.fields.length > 0 ? (
          <div className={colorLinesGridClass(colorLines.fields.length)}>
            {colorLines.fields.map((line, index) => (
              <FormField
                key={line.id}
                control={control}
                name={`color_lines.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colour #{index + 1}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={readOnly} placeholder={`Colour #${index + 1}`} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        ) : null}

        <div className="border-t border-border pt-5">
          <FormField
            control={control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea {...field} disabled={readOnly} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <p className="text-sm font-medium">Documents</p>
          {job ? <JobFileSlots job={job} /> : <JobFileSlotsPlaceholder />}
        </div>
      </JobFormSection>

      <CompanyQuickCreateDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        onCreated={(created) => {
          setValue("company_id", created.id, { shouldValidate: true, shouldDirty: true });
        }}
      />
    </div>
  );
}
