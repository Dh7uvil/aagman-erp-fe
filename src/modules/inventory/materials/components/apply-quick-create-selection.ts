import type { FieldValues, UseFormReturn } from "react-hook-form";

import type { Micron } from "@/modules/inventory/microns/schemas";
import { setFormValueFromQuickCreate } from "@/shared/lib/form-quick-create";

function asMasterForm(form: unknown): UseFormReturn<FieldValues> {
  return form as UseFormReturn<FieldValues>;
}

export function applyCreatedProductToMaterialForm(
  form: unknown,
  productId: string,
  companyId?: string | null,
) {
  const f = asMasterForm(form);
  setFormValueFromQuickCreate(f, "product_id", productId);
  if (companyId) {
    setFormValueFromQuickCreate(f, "company_id", companyId);
  }
}

export function applyCreatedMicronToMaterialForm(
  form: unknown,
  micron: Micron,
  canViewPrice: boolean,
) {
  const f = asMasterForm(form);
  setFormValueFromQuickCreate(f, "product_id", micron.product_id);
  setFormValueFromQuickCreate(f, "parent_id", micron.id);
  if (canViewPrice && micron.price_per_unit) {
    f.setValue("price_per_unit", micron.price_per_unit, { shouldValidate: false, shouldDirty: true });
  }
  if (micron.price_unit_id) {
    f.setValue("price_unit_id", micron.price_unit_id, { shouldValidate: false, shouldDirty: true });
  }
  f.clearErrors();
}

export function applyCreatedUnitToMaterialForm(
  form: unknown,
  field: "size_unit_id" | "price_unit_id" | "unit_id",
  unitId: string,
) {
  setFormValueFromQuickCreate(asMasterForm(form), field, unitId);
}

export function applyCreatedSizeLineUnitToMaterialForm(
  form: unknown,
  index: number,
  unitId: string,
) {
  setFormValueFromQuickCreate(asMasterForm(form), `size_lines.${index}.size_unit_id`, unitId);
}

export function applyCreatedSizeLineQuantityUnitToMaterialForm(
  form: unknown,
  index: number,
  unitId: string,
) {
  setFormValueFromQuickCreate(asMasterForm(form), `size_lines.${index}.unit_id`, unitId);
}

export function applyCreatedMicronToMaterialSizeLine(
  form: unknown,
  index: number,
  micron: Micron,
) {
  const f = asMasterForm(form);
  setFormValueFromQuickCreate(f, "product_id", micron.product_id);
  setFormValueFromQuickCreate(f, `size_lines.${index}.parent_id`, micron.id);
  f.clearErrors(`size_lines.${index}.parent_id`);
}
