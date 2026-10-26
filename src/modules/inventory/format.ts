import { formatDecimal } from "@/shared/lib/format";

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
