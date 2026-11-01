import { describe, expect, it } from "vitest";

import { sizeLineToCreatePayload, sizeLineToUpdatePayload } from "@/modules/inventory/materials/api";
import {
  consolidateMaterialSizeLines,
  materialSizeLineKey,
  materialSizeLineStockOmitFlags,
  resolveMaterialEditSizeLines,
  type MaterialEditFormValues,
  type MaterialSizeLineValues,
} from "@/modules/inventory/materials/schemas";

const micronA = "11111111-1111-4111-8111-111111111111";
const micronB = "22222222-2222-4222-8222-222222222222";
const sizeUnit = "33333333-3333-4333-8333-333333333333";
const qtyUnit = "44444444-4444-4444-8444-444444444444";

function line(
  overrides: Partial<MaterialSizeLineValues> & Pick<MaterialSizeLineValues, "parent_id" | "size">,
): MaterialSizeLineValues {
  return {
    size_unit_id: sizeUnit,
    quantity_available: "0",
    unit_id: qtyUnit,
    opening_rolls: "0",
    stock_in_rolls: "0",
    stock_in_kg: "0",
    is_active: true,
    ...overrides,
  };
}

describe("materialSizeLineKey", () => {
  it("includes micron so the same size under different microns stays distinct", () => {
    const base = { size: "300", size_unit_id: sizeUnit };
    expect(materialSizeLineKey({ ...base, parent_id: micronA })).not.toEqual(
      materialSizeLineKey({ ...base, parent_id: micronB }),
    );
  });
});

describe("consolidateMaterialSizeLines", () => {
  it("merges duplicate rows for the same micron and size", () => {
    const { lines: result } = consolidateMaterialSizeLines([
      line({ parent_id: micronA, size: "300", opening_rolls: "2", quantity_available: "10" }),
      line({ parent_id: micronA, size: "300", opening_rolls: "3", quantity_available: "5" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.parent_id).toBe(micronA);
    expect(result[0]?.opening_rolls).toBe("5.00");
    expect(result[0]?.quantity_available).toBe("15.00");
  });

  it("merges saved rows with the same key and records removed ids", () => {
    const keepId = "55555555-5555-4555-8555-555555555555";
    const dropId = "66666666-6666-4666-8666-666666666666";
    const { lines: result, removedIds } = consolidateMaterialSizeLines([
      line({ id: keepId, parent_id: micronA, size: "300", opening_rolls: "1" }),
      line({ id: dropId, parent_id: micronA, size: "300", opening_rolls: "2" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(keepId);
    expect(result[0]?.opening_rolls).toBe("3.00");
    expect(removedIds).toEqual([dropId]);
  });

  it("treats extra same-size rows as stock increments when a saved row exists", () => {
    const keepId = "55555555-5555-4555-8555-555555555555";
    const { lines: result } = consolidateMaterialSizeLines([
      line({ id: keepId, parent_id: micronA, size: "300", opening_rolls: "10" }),
      line({ parent_id: micronA, size: "300", opening_rolls: "1" }),
      line({ parent_id: micronA, size: "300", opening_rolls: "1" }),
      line({ parent_id: micronA, size: "300", opening_rolls: "1" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.opening_rolls).toBe("10.00");
    expect(result[0]?.stock_in_rolls).toBe("3.00");
  });

  it("sums kg from extra same-size rows into stock-in when a saved row exists", () => {
    const keepId = "55555555-5555-4555-8555-555555555555";
    const { lines: result } = consolidateMaterialSizeLines([
      line({
        id: keepId,
        parent_id: micronA,
        size: "300",
        opening_rolls: "10",
        quantity_available: "500",
      }),
      line({ parent_id: micronA, size: "300", quantity_available: "100" }),
      line({ parent_id: micronA, size: "300", quantity_available: "50" }),
      line({ parent_id: micronA, size: "300", stock_in_kg: "25" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity_available).toBe("500.00");
    expect(result[0]?.stock_in_kg).toBe("175.00");
  });

  it("sums draft-only duplicate rows for create", () => {
    const { lines: result } = consolidateMaterialSizeLines([
      line({ parent_id: micronA, size: "300", opening_rolls: "1", quantity_available: "5" }),
      line({ parent_id: micronA, size: "300", opening_rolls: "1", quantity_available: "10" }),
      line({ parent_id: micronA, size: "300", opening_rolls: "1", quantity_available: "15" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.opening_rolls).toBe("3.00");
    expect(result[0]?.quantity_available).toBe("30.00");
  });

  it("keeps the same size under different microns as separate lines", () => {
    const { lines: result } = consolidateMaterialSizeLines([
      line({ parent_id: micronA, size: "300" }),
      line({ parent_id: micronB, size: "300" }),
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((row) => row.parent_id).sort()).toEqual([micronA, micronB].sort());
  });

  it("skips rows without a micron", () => {
    const { lines: result } = consolidateMaterialSizeLines([
      line({ parent_id: "", size: "300" }),
      line({ parent_id: micronA, size: "400" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.parent_id).toBe(micronA);
  });
});

describe("materialSizeLineStockOmitFlags", () => {
  it("omits rolls and kg independently for stock-in", () => {
    expect(
      materialSizeLineStockOmitFlags({ stock_in_rolls: "2", stock_in_kg: "0" }),
    ).toEqual({ omitRolls: true, omitKg: false });
    expect(
      materialSizeLineStockOmitFlags({ stock_in_rolls: "0", stock_in_kg: "50" }),
    ).toEqual({ omitRolls: false, omitKg: true });
  });
});

describe("resolveMaterialEditSizeLines", () => {
  it("clears receive rolls when it matches on-hand on a saved row", () => {
    const keepId = "55555555-5555-4555-8555-555555555555";
    const values: MaterialEditFormValues = {
      company_id: "",
      product_id: "66666666-6666-4666-8666-666666666666",
      parent_id: micronA,
      price_per_unit: "",
      price_unit_id: "",
      size_lines: [
        line({
          id: keepId,
          parent_id: micronA,
          size: "300",
          opening_rolls: "10",
          stock_in_rolls: "10",
        }),
      ],
    };
    expect(resolveMaterialEditSizeLines(values)[0]?.stock_in_rolls).toBe("0");
  });

  it("uses form micron when a row micron is empty", () => {
    const values: MaterialEditFormValues = {
      company_id: "",
      product_id: "66666666-6666-4666-8666-666666666666",
      parent_id: micronA,
      price_per_unit: "",
      price_unit_id: "",
      size_lines: [line({ parent_id: "", size: "300" })],
    };
    expect(resolveMaterialEditSizeLines(values)[0]?.parent_id).toBe(micronA);
  });
});

describe("size line API payloads", () => {
  it("create payload uses the line micron as parent_id", () => {
    const payload = sizeLineToCreatePayload(
      line({ parent_id: micronB, size: "450", opening_rolls: "1", quantity_available: "2" }),
    );
    expect(payload.parent_id).toBe(micronB);
    expect(payload.size).toBe("450");
  });

  it("update payload includes parent_id for micron moves", () => {
    const payload = sizeLineToUpdatePayload(
      line({
        id: "55555555-5555-4555-8555-555555555555",
        parent_id: micronB,
        size: "300",
      }),
    );
    expect(payload.parent_id).toBe(micronB);
  });
});
