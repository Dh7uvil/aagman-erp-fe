import { z } from "zod";

import type { Material } from "@/modules/inventory/materials/schemas";
import { formatDecimal, isNumericDecimalString } from "@/shared/lib/format";

function parseQty(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function buildStockOutFormSchema(materials: Material[]) {
  return z
    .object({
      material_id: z.string().uuid("Select a width"),
      rolls: z.string(),
      kilograms: z.string(),
      note: z.string().max(2000).optional(),
    })
    .superRefine((values, ctx) => {
      const material = materials.find((row) => row.id === values.material_id);
      const maxRolls = material ? parseQty(String(material.rolls_on_hand)) : 0;
      const maxKg = material ? parseQty(String(material.total_kg)) : 0;
      const rolls = parseQty(values.rolls);
      const kilograms = parseQty(values.kilograms);

      if (!isNumericDecimalString(values.rolls.trim() || "0") || rolls < 0) {
        ctx.addIssue({ code: "custom", message: "Enter a valid roll count", path: ["rolls"] });
      }
      if (!isNumericDecimalString(values.kilograms.trim() || "0") || kilograms < 0) {
        ctx.addIssue({ code: "custom", message: "Enter a valid quantity", path: ["kilograms"] });
      }
      if (rolls === 0 && kilograms === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Enter rolls and/or kg to remove",
          path: ["rolls"],
        });
      }
      if (Number.isFinite(rolls) && rolls > maxRolls) {
        ctx.addIssue({
          code: "custom",
          message: `Cannot exceed ${formatDecimal(String(maxRolls))} rolls on hand`,
          path: ["rolls"],
        });
      }
      if (Number.isFinite(kilograms) && kilograms > maxKg) {
        ctx.addIssue({
          code: "custom",
          message: `Cannot exceed ${formatDecimal(String(maxKg))} kg on hand`,
          path: ["kilograms"],
        });
      }
    });
}

export type StockOutFormValues = z.infer<ReturnType<typeof buildStockOutFormSchema>>;
