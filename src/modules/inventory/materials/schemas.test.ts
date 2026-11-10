import { describe, expect, it } from "vitest";

import { sizeLineToCreatePayload, sizeLineToUpdatePayload } from "@/modules/inventory/materials/api";
import {
  buildExistingMaterialKeyMap,
  consolidateMaterialSizeLines,
  materialSizeLineDirectStockIncrease,
  materialSizeLineKey,
  materialSizeLineStockOmitFlags,
  micronPricePayloadsFromSizeLines,
  resolveMaterialEditSizeLines,
  type Material,
  type MaterialEditFormValues,
  type MaterialSizeLineValues,
} from "@/modules/inventory/materials/schemas";

const micronA = "11111111-1111-4111-8111-111111111111";
const micronB = "22222222-2222-4222-8222-222222222222";
const sizeUnit = "33333333-3333-4333-8333-333333333333";
const qtyUnit = "44444444-4444-4444-8444-444444444444";
const priceUnit = "77777777-7777-4777-8777-777777777777";

function line(
  overrides: Partial<MaterialSizeLineValues> & Pick<MaterialSizeLineValues, "parent_id" | "size">,
): MaterialSizeLineValues {
  return {
    price_per_unit: "",
    price_unit_id: "",
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

  it("uses the increment row price when merging stock into a saved row", () => {
    const keepId = "55555555-5555-4555-8555-555555555555";
    const { lines: result } = consolidateMaterialSizeLines([
      line({
        id: keepId,
        parent_id: micronA,
        size: "300",
        opening_rolls: "10",
        price_per_unit: "180",
        price_unit_id: priceUnit,
      }),
      line({
        parent_id: micronA,
        size: "300",
        opening_rolls: "2",
        price_per_unit: "185",
        price_unit_id: priceUnit,
      }),
    ]);
    expect(result[0]?.stock_in_rolls).toBe("2.00");
    expect(result[0]?.price_per_unit).toBe("185");
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

  it("merges draft rows with a matching catalog SKU not on the form", () => {
    const existingId = "88888888-8888-4888-8888-888888888888";
    const productId = "99999999-9999-4999-8999-999999999999";
    const catalogRow = {
      id: existingId,
      company_id: null,
      company_name: "",
      product_id: productId,
      product_name: "",
      micron_id: micronB,
      micron_name: "",
      size: "3",
      size_unit_id: sizeUnit,
      size_unit_code: "mm",
      size_label: "3 mm",
      unit_id: qtyUnit,
      unit_code: "kg",
      unit_name: "",
      name: "",
      rolls_on_hand: "5",
      total_kg: "100",
      price_per_unit: null,
      price_unit_id: null,
      price_unit_code: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    } satisfies Material;
    const existingByKey = buildExistingMaterialKeyMap([catalogRow], productId);
    const { lines: result } = consolidateMaterialSizeLines(
      [line({ parent_id: micronB, size: "3", opening_rolls: "2" })],
      existingByKey,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(existingId);
    expect(result[0]?.opening_rolls).toBe("5.00");
    expect(result[0]?.stock_in_rolls).toBe("2.00");
  });
});

describe("materialSizeLineDirectStockIncrease", () => {
  it("detects roll increases on a saved row when stock_in fields are empty", () => {
    const keepId = "55555555-5555-4555-8555-555555555555";
    const increase = materialSizeLineDirectStockIncrease(
      line({ id: keepId, parent_id: micronA, size: "300", opening_rolls: "15" }),
      { rollsOnHand: "10", totalKg: "100" },
    );
    expect(increase.rolls).toBe("5");
    expect(increase.kilograms).toBe("0");
  });

  it("returns zero when stock_in already carries the increment", () => {
    const keepId = "55555555-5555-4555-8555-555555555555";
    const increase = materialSizeLineDirectStockIncrease(
      line({
        id: keepId,
        parent_id: micronA,
        size: "300",
        opening_rolls: "10",
        stock_in_rolls: "2",
      }),
      { rollsOnHand: "10", totalKg: "0" },
    );
    expect(increase.rolls).toBe("0");
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

  it("does not fill micron from a removed form-level field", () => {
    const values: MaterialEditFormValues = {
      company_id: "",
      product_id: "66666666-6666-4666-8666-666666666666",
      size_lines: [line({ parent_id: "", size: "300" })],
    };
    expect(resolveMaterialEditSizeLines(values)[0]?.parent_id).toBe("");
  });
});

describe("micronPricePayloadsFromSizeLines", () => {
  it("returns one payload per micron with the last line price winning", () => {
    const payloads = micronPricePayloadsFromSizeLines([
      line({
        parent_id: micronA,
        size: "300",
        price_per_unit: "10",
        price_unit_id: priceUnit,
      }),
      line({
        parent_id: micronA,
        size: "400",
        price_per_unit: "12",
        price_unit_id: priceUnit,
      }),
      line({
        parent_id: micronB,
        size: "300",
        price_per_unit: "20",
        price_unit_id: priceUnit,
      }),
    ]);
    expect(payloads).toHaveLength(2);
    const micronAPayload = payloads.find((item) => item.id === micronA);
    expect(micronAPayload?.price_per_unit).toBe("12");
    expect(payloads.find((item) => item.id === micronB)?.price_per_unit).toBe("20");
  });

  it("skips microns without a price unit", () => {
    const payloads = micronPricePayloadsFromSizeLines([
      line({ parent_id: micronA, size: "300", price_per_unit: "10", price_unit_id: "" }),
    ]);
    expect(payloads).toHaveLength(0);
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
