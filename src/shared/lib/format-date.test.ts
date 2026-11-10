import { describe, expect, it } from "vitest";

import { formatAuditValue } from "@/modules/users-management/audit-logs/audit-log-format";
import { formatBucketLabel } from "@/modules/dashboard/lib/bucket-label";
import { formatCalendarDate, formatDate, formatDateTime } from "@/shared/lib/format";

describe("date display format", () => {
  it("renders calendar dates as dd/mm/yyyy", () => {
    expect(formatDate("2026-11-03")).toBe("03/11/2026");
    expect(formatDate("2026-01-09")).toBe("09/01/2026");
    expect(formatCalendarDate(new Date(2026, 0, 9))).toBe("09/01/2026");
  });

  it("keeps the date prefix of an ISO timestamp when only the date is shown", () => {
    expect(formatDate("2026-11-03T18:30:00Z")).toBe("03/11/2026");
  });

  it("renders timestamps as dd/mm/yyyy with the local time", () => {
    const value = "2026-11-03T08:07:06";
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    expect(formatDateTime(value)).toBe(
      `${day}/${month}/${date.getFullYear()}, ${hours}:${minutes}:${seconds}`,
    );
  });

  it("leaves empty and unparseable values unchanged", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("not-a-date")).toBe("not-a-date");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
  });

  it("uses the same date format on dashboard buckets and audit values", () => {
    expect(formatBucketLabel("2026-11-03")).toBe("03/11/2026");
    expect(formatAuditValue("2026-11-03")).toEqual({ kind: "text", text: "03/11/2026" });
    expect(formatAuditValue("qty 12")).toEqual({ kind: "text", text: "qty 12" });
  });
});
