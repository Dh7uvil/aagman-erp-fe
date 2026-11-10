import { z } from "zod";

import { DISPLAY_SCALE, isNumericDecimalString, normalizeDecimalInput } from "@/shared/lib/format";

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
  company_id: z.string().uuid().nullable(),
  company_name: z.string(),
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
  avg_price_per_unit: NullableDecimalStringSchema.optional(),
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

const stockInNumeric = z
  .string()
  .refine((value) => isNumericDecimalString(value.trim() || "0"), {
    message: "Enter a valid number",
  })
  .refine((value) => Number(value.trim() || "0") >= 0, {
    message: "Must be zero or greater",
  });

const linePriceUnitIdSchema = z.union([
  z.literal(""),
  z.string().uuid({ message: "Select price unit" }),
]);

export const MaterialSizeLineSchema = z.object({
  id: z.string().uuid().optional(),
  parent_id: z.union([
    z.literal(""),
    z.string().uuid({ message: "Select a micron" }),
  ]),
  price_per_unit: z.string(),
  price_unit_id: linePriceUnitIdSchema,
  size: sizeLineNumeric,
  size_unit_id: z.string().uuid({ message: "Select size unit" }),
  quantity_available: z.string(),
  unit_id: z.string().uuid({ message: "Select quantity unit" }),
  opening_rolls: z.string(),
  /** Incoming stock for an existing width (IN movement); not a second SKU row. */
  stock_in_rolls: stockInNumeric,
  stock_in_kg: stockInNumeric,
  is_active: z.boolean(),
});
export type MaterialSizeLineValues = z.infer<typeof MaterialSizeLineSchema>;

function addQuantityStrings(left: string, right: string): string {
  const a = normalizeDecimalInput(left.trim() || "0", DISPLAY_SCALE);
  const b = normalizeDecimalInput(right.trim() || "0", DISPLAY_SCALE);
  return normalizeDecimalInput(String(Number(a) + Number(b)), DISPLAY_SCALE);
}

/** Stable key for matching size lines (300 and 300.00 are the same size). */
export function materialSizeLineKey(
  line: Pick<MaterialSizeLineValues, "parent_id" | "size" | "size_unit_id">,
): string {
  const size = line.size.trim();
  const normalized = size === "" ? "" : normalizeDecimalInput(size, DISPLAY_SCALE);
  return `${line.parent_id}::${normalized}::${line.size_unit_id}`;
}

export type ConsolidatedMaterialSizeLines = {
  lines: MaterialSizeLineValues[];
  /** Material ids merged into another row (delete after persisting the survivor). */
  removedIds: string[];
};

function catalogRowToSizeLine(row: Material): MaterialSizeLineValues {
  return {
    id: row.id,
    parent_id: row.micron_id,
    price_per_unit: row.price_per_unit != null ? String(row.price_per_unit) : "",
    price_unit_id: row.price_unit_id ?? "",
    size: formQuantityValue(row.size),
    size_unit_id: row.size_unit_id,
    quantity_available: formQuantityValue(row.total_kg),
    unit_id: row.unit_id ?? "",
    opening_rolls: formQuantityValue(row.rolls_on_hand),
    stock_in_rolls: "0",
    stock_in_kg: "0",
    is_active: row.is_active,
  };
}

/** Micron+size+unit → existing SKU for the product (first match wins). */
export function buildExistingMaterialKeyMap(
  materials: Material[],
  productId: string,
): Map<string, Material> {
  const map = new Map<string, Material>();
  for (const row of materials) {
    if (row.product_id !== productId) {
      continue;
    }
    const key = materialSizeLineKey({
      parent_id: row.micron_id,
      size: formQuantityValue(row.size),
      size_unit_id: row.size_unit_id,
    });
    if (!map.has(key)) {
      map.set(key, row);
    }
  }
  return map;
}

/** Merge duplicate sizes (rolls/kg summed). Same micron+size+unit always becomes one line. */
export function consolidateMaterialSizeLines(
  lines: MaterialSizeLineValues[],
  existingByKey?: Map<string, Material>,
): ConsolidatedMaterialSizeLines {
  const byKey = new Map<string, MaterialSizeLineValues[]>();
  const removedIds: string[] = [];

  for (const line of lines) {
    if (!line.parent_id || !line.size_unit_id) {
      continue;
    }
    const key = materialSizeLineKey(line);
    const group = byKey.get(key) ?? [];
    group.push(line);
    byKey.set(key, group);
  }

  const result: MaterialSizeLineValues[] = [];
  for (const group of byKey.values()) {
    let savedRows = group.filter((line) => line.id);
    const draftRows = group.filter((line) => !line.id);

    if (savedRows.length === 0 && draftRows.length > 0 && existingByKey) {
      const catalogRow = existingByKey.get(materialSizeLineKey(draftRows[0]!));
      if (catalogRow) {
        savedRows = [catalogRowToSizeLine(catalogRow)];
      }
    }

    if (savedRows.length > 0) {
      const [primary, ...extraSaved] = savedRows;
      let merged = mergeDraftIncrementsIntoStockIn(primary!, draftRows);
      for (const extra of extraSaved) {
        if (extra.id) {
          removedIds.push(extra.id);
        }
        merged.opening_rolls = addQuantityStrings(merged.opening_rolls, extra.opening_rolls);
        merged.quantity_available = addQuantityStrings(
          merged.quantity_available,
          extra.quantity_available,
        );
        merged.stock_in_rolls = addQuantityStrings(merged.stock_in_rolls, extra.stock_in_rolls);
        merged.stock_in_kg = addQuantityStrings(merged.stock_in_kg, extra.stock_in_kg);
      }
      result.push(merged);
      continue;
    }

    if (draftRows.length > 0) {
      result.push(mergeDraftRowsForCreate(draftRows));
    }
  }

  return { lines: result, removedIds };
}

export function materialSizeLineHasStockIn(
  line: Pick<MaterialSizeLineValues, "stock_in_rolls" | "stock_in_kg">,
): boolean {
  const rolls = Number(normalizeDecimalInput(line.stock_in_rolls.trim() || "0", DISPLAY_SCALE));
  const kg = Number(normalizeDecimalInput(line.stock_in_kg.trim() || "0", DISPLAY_SCALE));
  return rolls > 0 || kg > 0;
}

/** When stock-in applies, omit only the matching on-hand fields from PATCH (rolls vs kg). */
export function materialSizeLineStockOmitFlags(
  line: Pick<MaterialSizeLineValues, "stock_in_rolls" | "stock_in_kg">,
): { omitRolls: boolean; omitKg: boolean } {
  const rolls = Number(normalizeDecimalInput(line.stock_in_rolls.trim() || "0", DISPLAY_SCALE));
  const kg = Number(normalizeDecimalInput(line.stock_in_kg.trim() || "0", DISPLAY_SCALE));
  return { omitRolls: rolls > 0, omitKg: kg > 0 };
}

function parseFormQuantity(value: string): number {
  return Number(normalizeDecimalInput(value.trim() || "0", DISPLAY_SCALE));
}

/** Saved-row roll/kg increases (not already in stock_in_* fields) need an explicit IN movement with line price. */
export function materialSizeLineDirectStockIncrease(
  line: MaterialSizeLineValues,
  baseline: { rollsOnHand: string; totalKg: string },
): { rolls: string; kilograms: string } {
  if (!line.id) {
    return { rolls: "0", kilograms: "0" };
  }
  if (materialSizeLineHasStockIn(line)) {
    return { rolls: "0", kilograms: "0" };
  }
  const rollDelta = Math.max(
    0,
    parseFormQuantity(line.opening_rolls) - parseFormQuantity(formQuantityValue(baseline.rollsOnHand)),
  );
  const kgDelta = Math.max(
    0,
    parseFormQuantity(line.quantity_available) -
      parseFormQuantity(formQuantityValue(baseline.totalKg)),
  );
  return {
    rolls: rollDelta > 0 ? String(rollDelta) : "0",
    kilograms: kgDelta > 0 ? String(kgDelta) : "0",
  };
}

export function stockInMovementPriceFields(
  line: Pick<MaterialSizeLineValues, "price_per_unit" | "price_unit_id">,
  canViewPrice: boolean,
): { price_per_unit?: string; price_unit_id?: string | null } {
  const purchasePrice = line.price_per_unit.trim();
  if (!canViewPrice || purchasePrice === "") {
    return {};
  }
  return {
    price_per_unit: purchasePrice,
    price_unit_id: line.price_unit_id || null,
  };
}

/** Saved-row receive rolls must be increments only, not a repeat of on-hand in the wrong field. */
function normalizeSavedRowStockInLine(line: MaterialSizeLineValues): MaterialSizeLineValues {
  if (!line.id) {
    return line;
  }
  const increment = normalizeDecimalInput(line.stock_in_rolls.trim() || "0", DISPLAY_SCALE);
  const onHand = normalizeDecimalInput(line.opening_rolls.trim() || "0", DISPLAY_SCALE);
  if (Number(increment) > 0 && Number(increment) === Number(onHand)) {
    return { ...line, stock_in_rolls: "0" };
  }
  return line;
}

export const MaterialEditFormSchema = z
  .object({
    company_id: z.union([
      z.literal(""),
      z.string().uuid({ message: "Select a company" }),
    ]),
    product_id: z.string().uuid({ message: "Select a product" }),
    size_lines: z.array(MaterialSizeLineSchema).min(1, "Add at least one size"),
  })
  .superRefine((data, ctx) => {
    data.size_lines.forEach((line, index) => {
      if (!line.parent_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a micron",
          path: ["size_lines", index, "parent_id"],
        });
      }
    });
  });
export type MaterialEditFormValues = z.infer<typeof MaterialEditFormSchema>;

export const MaterialCreateFormSchema = MaterialEditFormSchema.safeExtend({
  company_id: z.string().uuid({ message: "Select a company" }),
});
export type MaterialCreateFormValues = z.infer<typeof MaterialCreateFormSchema>;

export type MaterialProductEditContext = {
  productId: string;
  companyId?: string;
  /** URL context on edit: only load sizes for this micron. */
  defaultMicronId?: string;
  defaultSizeUnitId?: string;
  defaultQuantityUnitId?: string;
};

/** Apply shared units when a row omits them. */
export function resolveMaterialEditSizeLines(
  values: MaterialEditFormValues,
): MaterialSizeLineValues[] {
  const fallbackSizeUnitId =
    values.size_lines.find((line) => line.size_unit_id)?.size_unit_id ?? "";
  const fallbackQuantityUnitId =
    values.size_lines.find((line) => line.unit_id)?.unit_id ?? "";
  return values.size_lines.map((line) =>
    normalizeSavedRowStockInLine({
      ...line,
      size_unit_id: line.size_unit_id || fallbackSizeUnitId,
      unit_id: line.unit_id || fallbackQuantityUnitId,
    }),
  );
}

export type MicronPriceUpdatePayload = {
  id: string;
  price_per_unit: string | null;
  price_unit_id: string;
};

/** One micron PATCH payload per distinct parent_id (last line wins for that micron). */
export function micronPricePayloadsFromSizeLines(
  lines: MaterialSizeLineValues[],
): MicronPriceUpdatePayload[] {
  const byMicron = new Map<string, { price_per_unit: string; price_unit_id: string }>();
  for (const line of lines) {
    if (!line.parent_id) {
      continue;
    }
    const priceUnitId = line.price_unit_id.trim();
    if (!priceUnitId) {
      continue;
    }
    byMicron.set(line.parent_id, {
      price_per_unit: line.price_per_unit.trim(),
      price_unit_id: priceUnitId,
    });
  }
  return [...byMicron.entries()].map(([id, { price_per_unit, price_unit_id }]) => ({
    id,
    price_per_unit: price_per_unit === "" ? null : price_per_unit,
    price_unit_id,
  }));
}

function draftRollIncrement(line: MaterialSizeLineValues): string {
  return addQuantityStrings(line.stock_in_rolls, line.opening_rolls);
}

function draftKgIncrement(line: MaterialSizeLineValues): string {
  return addQuantityStrings(line.stock_in_kg, line.quantity_available);
}

function draftLineHasStockIncrement(draft: MaterialSizeLineValues): boolean {
  return parseFormQuantity(draftRollIncrement(draft)) > 0 || parseFormQuantity(draftKgIncrement(draft)) > 0;
}

function mergeDraftIncrementsIntoStockIn(
  base: MaterialSizeLineValues,
  drafts: MaterialSizeLineValues[],
): MaterialSizeLineValues {
  let stockInRolls = base.stock_in_rolls;
  let stockInKg = base.stock_in_kg;
  let price_per_unit = base.price_per_unit;
  let price_unit_id = base.price_unit_id;
  for (const draft of drafts) {
    stockInRolls = addQuantityStrings(stockInRolls, draftRollIncrement(draft));
    stockInKg = addQuantityStrings(stockInKg, draftKgIncrement(draft));
    if (draftLineHasStockIncrement(draft)) {
      const draftPrice = draft.price_per_unit.trim();
      if (draftPrice !== "") {
        price_per_unit = draftPrice;
        price_unit_id = draft.price_unit_id.trim() || price_unit_id;
      }
    }
  }
  return {
    ...base,
    opening_rolls: base.opening_rolls,
    quantity_available: base.quantity_available,
    stock_in_rolls: stockInRolls,
    stock_in_kg: stockInKg,
    price_per_unit,
    price_unit_id,
  };
}

function mergeDraftRowsForCreate(drafts: MaterialSizeLineValues[]): MaterialSizeLineValues {
  const [first, ...rest] = drafts;
  if (!first) {
    return emptyMaterialSizeLine();
  }
  let merged: MaterialSizeLineValues = { ...first };
  for (const line of rest) {
    merged = {
      ...merged,
      opening_rolls: addQuantityStrings(merged.opening_rolls, line.opening_rolls),
      quantity_available: addQuantityStrings(merged.quantity_available, line.quantity_available),
      stock_in_rolls: addQuantityStrings(merged.stock_in_rolls, line.stock_in_rolls),
      stock_in_kg: addQuantityStrings(merged.stock_in_kg, line.stock_in_kg),
      is_active: merged.is_active && line.is_active,
    };
  }
  merged.opening_rolls = addQuantityStrings(merged.opening_rolls, merged.stock_in_rolls);
  merged.quantity_available = addQuantityStrings(merged.quantity_available, merged.stock_in_kg);
  merged.stock_in_rolls = "0";
  merged.stock_in_kg = "0";
  return merged;
}

export function buildMaterialEditFormValues(
  materials: Material[],
  context: MaterialProductEditContext,
): MaterialEditFormValues {
  const defaultMicronId = context.defaultMicronId?.trim() ?? "";
  let forProduct = materials.filter((row) => row.product_id === context.productId);
  if (defaultMicronId !== "") {
    forProduct = forProduct.filter((row) => row.micron_id === defaultMicronId);
  }
  const sorted = [...forProduct].sort((a, b) => {
    const byMicron = a.micron_name.localeCompare(b.micron_name);
    if (byMicron !== 0) {
      return byMicron;
    }
    return Number(a.size) - Number(b.size);
  });
  const sizeUnitFallback =
    sorted[0]?.size_unit_id ?? context.defaultSizeUnitId ?? "";
  const quantityUnitFallback =
    sorted[0]?.unit_id ?? context.defaultQuantityUnitId ?? "";

  const micronIds = new Set(sorted.map((row) => row.micron_id));
  const defaultLineMicronId =
    defaultMicronId !== ""
      ? defaultMicronId
      : micronIds.size === 1
        ? [...micronIds][0]!
        : "";

  const companyId =
    context.companyId ??
    sorted[0]?.company_id ??
    "";

  const defaultLinePrice =
    sorted[0]?.price_per_unit != null ? String(sorted[0].price_per_unit) : "";
  const defaultLinePriceUnitId = sorted[0]?.price_unit_id ?? "";

  return {
    company_id: companyId ?? "",
    product_id: context.productId,
    size_lines:
      sorted.length > 0
        ? consolidateMaterialSizeLines(
            sorted.map((row) => ({
              id: row.id,
              parent_id: row.micron_id,
              price_per_unit: row.price_per_unit != null ? String(row.price_per_unit) : "",
              price_unit_id: row.price_unit_id ?? "",
              size: formQuantityValue(row.size),
              size_unit_id: row.size_unit_id,
              quantity_available: formQuantityValue(row.total_kg),
              unit_id: row.unit_id ?? "",
              opening_rolls: formQuantityValue(row.rolls_on_hand),
              stock_in_rolls: "0",
              stock_in_kg: "0",
              is_active: row.is_active,
            })),
          ).lines
        : [
            emptyMaterialSizeLine(
              defaultLineMicronId,
              sizeUnitFallback,
              quantityUnitFallback,
              defaultLinePrice,
              defaultLinePriceUnitId,
            ),
          ],
  };
}

/** @deprecated Use buildMaterialEditFormValues with product context. */
export function materialsToEditFormValues(
  materials: Material[],
  fallback: Material | null,
): MaterialEditFormValues {
  const productId = fallback?.product_id ?? materials[0]?.product_id ?? "";
  return buildMaterialEditFormValues(materials, {
    productId,
    companyId: fallback?.company_id ?? materials[0]?.company_id ?? undefined,
    defaultMicronId: fallback?.micron_id ?? "",
    defaultSizeUnitId: fallback?.size_unit_id,
    defaultQuantityUnitId: fallback?.unit_id ?? undefined,
  });
}

/** Blank create form (no product/micron/size prefill). */
export function emptyMaterialCreateFormValues(
  defaultSizeUnitId = "",
  defaultQuantityUnitId = "",
): MaterialCreateFormValues {
  return {
    company_id: "",
    product_id: "",
    size_lines: [emptyMaterialSizeLine("", defaultSizeUnitId, defaultQuantityUnitId)],
  };
}

export function emptyMaterialSizeLine(
  parentId = "",
  sizeUnitId = "",
  quantityUnitId = "",
  pricePerUnit = "",
  priceUnitId = "",
): MaterialSizeLineValues {
  return {
    parent_id: parentId,
    price_per_unit: pricePerUnit,
    price_unit_id: priceUnitId,
    size: "0",
    size_unit_id: sizeUnitId,
    quantity_available: "0",
    unit_id: quantityUnitId,
    opening_rolls: "0",
    stock_in_rolls: "0",
    stock_in_kg: "0",
    is_active: true,
  };
}

export function uniqueMicronIdsFromSizeLines(
  lines: Pick<MaterialSizeLineValues, "parent_id">[],
): string[] {
  return [...new Set(lines.map((line) => line.parent_id).filter(Boolean))];
}

export function uniqueMicronIdsFromEditValues(values: MaterialEditFormValues): string[] {
  return uniqueMicronIdsFromSizeLines(resolveMaterialEditSizeLines(values));
}

export const MaterialHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string(),
  kind: z.enum(["stock", "edit"]),
  action: z.string(),
  user: z.object({ id: z.string().uuid(), name: z.string() }).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  company_name: z.string().optional(),
  rolls: z.union([z.string(), z.number()]).nullable().optional(),
  kilograms: z.union([z.string(), z.number()]).nullable().optional(),
  price_per_unit: z.union([z.string(), z.number()]).nullable().optional(),
  price_unit_code: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  changes: z
    .array(
      z.object({
        field: z.string(),
        old_value: z.unknown().optional(),
        new_value: z.unknown().optional(),
      }),
    )
    .optional(),
});
export type MaterialHistoryEntry = z.infer<typeof MaterialHistoryEntrySchema>;

export const MaterialHistorySummarySchema = z.object({
  company_id: z.string().uuid().nullable(),
  company_name: z.string(),
  size_label: z.string(),
  product_name: z.string(),
  micron_name: z.string(),
  rolls_on_hand: z.union([z.string(), z.number()]),
  total_kg: z.union([z.string(), z.number()]),
  last_purchase_price: z.union([z.string(), z.number()]).nullable().optional(),
  last_purchase_price_unit_code: z.string().nullable().optional(),
  last_purchase_date: z.string().nullable().optional(),
  last_purchase_rolls: z.union([z.string(), z.number()]).nullable().optional(),
  avg_price_per_unit: z.union([z.string(), z.number()]).nullable().optional(),
  price_unit_code: z.string().nullable().optional(),
});
export type MaterialHistorySummary = z.infer<typeof MaterialHistorySummarySchema>;

export type MaterialListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  parent_id?: string;
  product_id?: string;
  company_id?: string;
  is_active?: boolean;
  size?: string;
  rolls?: string;
  kg_lt?: string;
  kg_gt?: string;
  include_column_totals?: boolean;
};
