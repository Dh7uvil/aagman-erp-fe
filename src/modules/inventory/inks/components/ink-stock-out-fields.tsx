"use client";

import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";

import {
  type InkStockOutFormValues,
} from "@/modules/inventory/inks/components/ink-stock-out-schema";
import { stockOutButtonClassName } from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import type { InkLine } from "@/modules/inventory/inks/schemas";
import { inkRoutes } from "@/modules/inventory/inks/routes";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { FormDialogFooter } from "@/shared/components/form/form-dialog-footer";
import { SearchableSelect } from "@/shared/components/form/searchable-select";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { Button } from "@/shared/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatDecimal } from "@/shared/lib/format";

function lineLabel(line: InkLine) {
  return `${line.brand_name} · ${line.color_name} (${formatDecimal(line.total_qty)} ${line.drum_unit_code})`;
}

function QuantitiesSectionHeader() {
  return (
    <div className="space-y-1.5">
      <p className="leading-none font-semibold">Quantities to remove</p>
      <p className="text-muted-foreground text-sm">
        Enter drums and/or quantity to stock out. At least one must be greater than zero.
      </p>
    </div>
  );
}

export function InkStockOutFields({
  lines,
  form,
  formError,
  pending,
  onClose,
  onSubmitForm,
  layout,
}: {
  lines: InkLine[];
  form: UseFormReturn<InkStockOutFormValues>;
  formError: string | null;
  pending: boolean;
  onClose: () => void;
  onSubmitForm: (values: InkStockOutFormValues) => Promise<void>;
  layout: "dialog" | "page";
}) {
  const inkLineId = useWatch({ control: form.control, name: "ink_line_id" });
  const selectedLine = lines.find((line) => line.id === inkLineId) ?? lines[0];
  const unitCode = selectedLine?.drum_unit_code ?? "kg";
  const showLineSelect = lines.length > 1;

  if (lines.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Add ink lines before recording stock out.</p>
    );
  }

  const quantitiesBlock = (
    <div className="space-y-4">
      {layout === "dialog" ? <QuantitiesSectionHeader /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="drums"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Drums out</FormLabel>
              <FormControl>
                <DecimalInput kind="quantity" {...field} placeholder="0" disabled={!selectedLine} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{unitCode} out</FormLabel>
              <FormControl>
                <DecimalInput kind="quantity" {...field} placeholder="0" disabled={!selectedLine} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Note (optional)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={layout === "page" ? 3 : 2}
                placeholder="e.g. Issued to production"
                className="resize-none"
                disabled={!selectedLine}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <>
      {showLineSelect ? (
        <FormField
          control={form.control}
          name="ink_line_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ink line</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select line"
                  options={lines.map((line) => ({
                    value: line.id,
                    label: lineLabel(line),
                  }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {selectedLine ? (
        <p className="text-muted-foreground text-sm">
          {selectedLine.brand_name} · {selectedLine.color_name}
          {" · On hand "}
          <span className="text-foreground font-medium tabular-nums">
            {formatDecimal(String(selectedLine.drum_count))} drums ·{" "}
            {formatDecimal(String(selectedLine.total_qty))} {selectedLine.drum_unit_code}
          </span>
        </p>
      ) : null}

      {quantitiesBlock}

      {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

      {layout === "dialog" ? (
        <FormDialogFooter
          pending={pending}
          canSubmit={Boolean(selectedLine)}
          submitLabel="Record stock out"
          submitVariant="outline"
          submitClassName={stockOutButtonClassName}
          onClose={onClose}
          onSubmit={() => void form.handleSubmit(onSubmitForm)()}
        />
      ) : (
        <div className="flex flex-wrap gap-2 pt-2">
          <SubmitButton
            isPending={pending}
            disabled={!selectedLine}
            variant="outline"
            className={stockOutButtonClassName}
          >
            Record stock out
          </SubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href={inkRoutes.list}>Cancel</Link>
          </Button>
        </div>
      )}
    </>
  );
}
