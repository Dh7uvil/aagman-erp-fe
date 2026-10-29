import { describe, expect, it } from "vitest";

import { syncCountToRows } from "@/modules/inventory/jobs/lib/sync-count-rows";

describe("syncCountToRows", () => {
  it("trims extra rows", () => {
    expect(syncCountToRows(2, [{ a: 1 }, { a: 2 }, { a: 3 }], () => ({ a: 0 }))).toEqual([
      { a: 1 },
      { a: 2 },
    ]);
  });

  it("appends empty rows", () => {
    expect(syncCountToRows(3, [{ a: 1 }], () => ({ a: 0 }))).toEqual([{ a: 1 }, { a: 0 }, { a: 0 }]);
  });
});
