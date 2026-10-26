import { z } from "zod";

import { isNumericDecimalString } from "@/shared/lib/format";

/** Form stock/count fields: empty API values display as zero like rolls and qty. */
function formQuantityValue(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") {
    return "0";
  }
  return String(value).trim();
}

function isPositiveDecimal(value: string): boolean {
  return isNumericDecimalString(value) && Number(value) > 0;
}

const DecimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "number" ? String(value) : value.trim()));

const NullableDecimalStringSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) =>
    value === null ? null : typeof value === "number" ? String(value) : value.trim(),
  );

export const MaterialSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_name: z.string(),
  micron_id: z.string().uuid(),
  micron_name: z.string(),
  size: DecimalStringSchema,
  size_unit_id: z.string().uuid(),
  size_unit_code: z.string(),
  size_label: z.string(),
  unit_id: z.string().uuid().nullable(),
  unit_code: z.string(),
  unit_name: z.string(),
  name: z.string(),
  rolls_on_hand: DecimalStringSchema,
  total_kg: DecimalStringSchema,
  price_per_unit: NullableDecimalStringSchema,
  price_unit_id: z.string().uuid().nullable(),
  price_unit_code: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Material = z.infer<typeof MaterialSchema>;

export const MaterialListSchema = z.array(MaterialSchema);

export const MaterialCreateRequestSchema = z.object({
  parent_id: z.string().uuid(),
  size: DecimalStringSchema,
  size_unit_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  name: z.string().max(200).optional(),
  opening_rolls: DecimalStringSchema.optional(),
  opening_kg: DecimalStringSchema.optional(),
  is_active: z.boolean().optional(),
});
export type MaterialCreateRequest = z.infer<typeof MaterialCreateRequestSchema>;

export const MaterialUpdateRequestSchema = z.object({
  parent_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  size: DecimalStringSchema.optional(),
  size_unit_id: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  rolls_on_hand: DecimalStringSchema.optional(),
  total_kg: DecimalStringSchema.optional(),
  is_active: z.boolean().optional(),
});
export type MaterialUpdateRequest = z.infer<typeof MaterialUpdateRequestSchema>;

export const MaterialFormSchema = z.object({
  product_id: z.string().uuid({ message: "Select a product" }),
  parent_id: z.string().uuid({ message: "Select a micron" }),
  size: z
    .string()
    .min(1, "Enter size")
    .refine((value) => isNumericDecimalString(value), { message: "Enter a valid number" })
    .refine(isPositiveDecimal, { message: "Enter a size greater than zero" }),
  size_unit_id: z.string().uuid({ message: "Select size unit" }),
  quantity_available: z.string(),
  unit_id: z.string().uuid({ message: "Select quantity unit" }),
  opening_rolls: z.string(),
  price_per_unit: z.string(),
  price_unit_id: z.union([
    z.literal(""),
    z.string().uuid({ message: "Select price unit" }),
  ]),
  is_active: z.boolean(),
});
export type MaterialFormValues = z.infer<typeof MaterialFormSchema>;

export function materialToFormValues(material: Material | null): MaterialFormValues {
  return {
    product_id: material?.product_id ?? "",
    parent_id: material?.micron_id ?? "",
    size: formQuantityValue(material?.size),
    size_unit_id: material?.size_unit_id ?? "",
    quantity_available: formQuantityValue(material?.total_kg),
    unit_id: material?.unit_id ?? "",
    opening_rolls: formQuantityValue(material?.rolls_on_hand),
    price_per_unit: material?.price_per_unit ?? "",
    price_unit_id: material?.price_unit_id ?? "",
    is_active: material?.is_active ?? true,
  };
}

const sizeLineNumeric = z
  .string()
  .min(1, "Enter size")
  .refine((value) => isNumericDecimalString(value), { message: "Enter a valid number" })
  .refine(isPositiveDecimal, { message: "Enter a size greater than zero" });

export const MaterialSizeLineSchema = z.object({
  id: z.string().uuid().optional(),
  size: sizeLineNumeric,
  size_unit_id: z.string().uuid({ message: "Select size unit" }),
  quantity_available: z.string(),
  unit_id: z.string().uuid({ message: "Select quantity unit" }),
  opening_rolls: z.string(),
  is_active: z.boolean(),
});
export type MaterialSizeLineValues = z.infer<typeof MaterialSizeLineSchema>;

export const MaterialEditFormSchema = z.object({
  product_id: z.string().uuid({ message: "Select a product" }),
  parent_id: z.string().uuid({ message: "Select a micron" }),
  price_per_unit: z.string(),
  price_unit_id: z.union([
    z.literal(""),
    z.string().uuid({ message: "Select price unit" }),
  ]),
  size_lines: z.array(MaterialSizeLineSchema).min(1, "Add at least one size"),
});
export type MaterialEditFormValues = z.infer<typeof MaterialEditFormSchema>;

export function materialsToEditFormValues(
  materials: Material[],
  fallback: Material | null,
): MaterialEditFormValues {
  const sorted = [...materials].sort((a, b) => Number(a.size) - Number(b.size));
  const base = sorted[0] ?? fallback ?? null;
  return {
    product_id: base?.product_id ?? "",
    parent_id: base?.micron_id ?? "",
    price_per_unit: base?.price_per_unit ?? "",
    price_unit_id: base?.price_unit_id ?? "",
    size_lines:
      sorted.length > 0
        ? sorted.map((row) => ({
            id: row.id,
            size: formQuantityValue(row.size),
            size_unit_id: row.size_unit_id,
            quantity_available: formQuantityValue(row.total_kg),
            unit_id: row.unit_id ?? "",
            opening_rolls: formQuantityValue(row.rolls_on_hand),
            is_active: row.is_active,
          }))
        : [
            {
              size: "0",
              size_unit_id: base?.size_unit_id ?? "",
              quantity_available: "0",
              unit_id: base?.unit_id ?? "",
              opening_rolls: "0",
              is_active: true,
            },
          ],
  };
}

export function emptyMaterialSizeLine(sizeUnitId = "", quantityUnitId = ""): MaterialSizeLineValues {
  return {
    size: "0",
    size_unit_id: sizeUnitId,
    quantity_available: "0",
    unit_id: quantityUnitId,
    opening_rolls: "0",
    is_active: true,
  };
}

export type MaterialListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  parent_id?: string;
  product_id?: string;
  is_active?: boolean;
  size?: string;
  rolls?: string;
  kg_lt?: string;
  kg_gt?: string;
};
