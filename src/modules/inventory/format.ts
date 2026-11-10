import type { Material } from "@/modules/inventory/materials/schemas";
import type { MaterialHistorySummary } from "@/modules/inventory/materials/schemas";
import { formatDecimal } from "@/shared/lib/format";

/** Micron value for display (e.g. `25 mic.`). */
export function formatMicronLabel(micronName: string): string {
  const trimmed = micronName.trim();
  if (!trimmed) {
    return "—";
  }
  return /\bmic\.?\b/i.test(trimmed) ? trimmed : `${trimmed} mic.`;
}

export function materialSizeLabel(
  material: Pick<Material, "size_label" | "size" | "size_unit_code">,
): string {
  return material.size_label || `${formatDecimal(material.size)} ${material.size_unit_code}`;
}

export function formatMaterialSizeMicronLabel(
  material: Pick<Material, "size_label" | "size" | "size_unit_code" | "micron_name">,
): string {
  return `${materialSizeLabel(material)} x ${formatMicronLabel(material.micron_name)}`;
}

export function formatMaterialHistorySkuTitle(summary: MaterialHistorySummary): string {
  return `${summary.product_name} · ${summary.size_label} x ${formatMicronLabel(summary.micron_name)}`;
}

export function formatPricePerUnit(
  price: string | null | undefined,
  unitCode: string | null | undefined,
): string {
  if (!price) {
    return "—";
  }
  const unit = unitCode?.trim() || "kg";
  return `${formatDecimal(price)} / ${unit}`;
}
