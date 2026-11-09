import { z } from "zod";

import type { SolventLine } from "@/modules/inventory/solvents/schemas";
import { formatDecimal, isNumericDecimalString } from "@/shared/lib/format";

function parseQty(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function buildSolventStockOutFormSchema(lines: SolventLine[]) {
  return z
    .object({
      solvent_line_id: z.string().uuid("Select an solvent line"),
      drums: z.string(),
      quantity: z.string(),
      note: z.string().max(2000).optional(),
    })
    .superRefine((values, ctx) => {
      const line = lines.find((row) => row.id === values.solvent_line_id);
      const maxDrums = line ? parseQty(String(line.drum_count)) : 0;
      const maxQty = line ? parseQty(String(line.total_qty)) : 0;
      const drums = parseQty(values.drums);
      const quantity = parseQty(values.quantity);

      if (!isNumericDecimalString(values.drums.trim() || "0") || drums < 0) {
        ctx.addIssue({ code: "custom", message: "Enter a valid drum count", path: ["drums"] });
      }
      if (!isNumericDecimalString(values.quantity.trim() || "0") || quantity < 0) {
        ctx.addIssue({ code: "custom", message: "Enter a valid quantity", path: ["quantity"] });
      }
      if (drums === 0 && quantity === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Enter drums and/or quantity to remove",
          path: ["drums"],
        });
      }
      if (Number.isFinite(drums) && drums > maxDrums) {
        ctx.addIssue({
          code: "custom",
          message: `Cannot exceed ${formatDecimal(String(maxDrums))} drums on hand`,
          path: ["drums"],
        });
      }
      if (Number.isFinite(quantity) && quantity > maxQty) {
        ctx.addIssue({
          code: "custom",
          message: `Cannot exceed ${formatDecimal(String(maxQty))} on hand`,
          path: ["quantity"],
        });
      }
    });
}

export type SolventStockOutFormValues = z.infer<ReturnType<typeof buildSolventStockOutFormSchema>>;
