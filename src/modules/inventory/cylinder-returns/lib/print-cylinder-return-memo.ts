"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import type { CylinderReturn } from "@/modules/inventory/cylinder-returns/schemas";
import { useAuthOrganizationBranding } from "@/modules/users-management/auth/queries";
import { useOrganization } from "@/modules/users-management/organization/queries";
import {
  organizationHeadquarters,
  type AddressPayload,
  type Organization,
} from "@/modules/users-management/organization/schemas";
import { formatCalendarDate } from "@/shared/lib/format";
import { toDisplayLogoUrl } from "@/shared/lib/logo-url";

export type CylinderReturnMemoIssuer = {
  name: string;
  logoUrl?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  addressLines: string[];
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlLines(lines: string[]): string {
  return lines.map((line) => escapeHtml(line)).join("<br />");
}

function addressLines(address: AddressPayload | null | undefined): string[] {
  if (!address) {
    return [];
  }
  const locality = [address.city, address.state]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(", ");
  const localityLine = [locality, address.postal_code?.trim() ?? ""].filter(Boolean).join(" ");
  return [
    address.address_line_1,
    address.address_line_2,
    address.address_line_3,
    localityLine,
    address.country,
  ]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean);
}

function formatMemoDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return formatCalendarDate(date);
}

function absoluteLogoUrl(url: string | undefined): string | undefined {
  if (!url || typeof window === "undefined") {
    return url;
  }
  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }
  return new URL(url, window.location.origin).href;
}

function issuerFromOrganization(
  org: Organization | undefined,
  brandingName: string | undefined,
  brandingLogo: string | null | undefined,
): CylinderReturnMemoIssuer {
  const name = org?.name?.trim() || brandingName?.trim() || "Organization";
  const logoSource = org?.logo_url ?? brandingLogo;
  return {
    name,
    logoUrl: absoluteLogoUrl(toDisplayLogoUrl(logoSource, org?.updated_at)),
    phone: org?.phone,
    email: org?.contact_email,
    website: org?.website,
    addressLines: addressLines(org ? organizationHeadquarters(org) : null),
  };
}

export function printCylinderReturnMemo(
  record: CylinderReturn,
  issuer: CylinderReturnMemoIssuer,
): boolean {
  const gst = record.company_gst_number?.trim() ?? "";
  const customerAddress = record.company_address?.trim() ?? "";
  const remarks = record.remarks?.trim() ?? "";
  const contact = [issuer.phone, issuer.email, issuer.website]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean);

  const logo = issuer.logoUrl
    ? `<img class="logo" src="${escapeHtml(issuer.logoUrl)}" alt="" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Cylinder return memo ${escapeHtml(record.return_number)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111;
      font-family: "Segoe UI", "Noto Sans", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }
    .sheet {
      max-width: 186mm;
      margin: 0 auto;
      border: 2px solid #111;
    }
    .letterhead {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #111;
      text-align: center;
    }
    .logo { width: 72px; height: 72px; object-fit: contain; flex: none; }
    .identity { flex: 1; min-width: 0; }
    .org-name {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .org-meta { margin: 4px 0 0; font-size: 11px; }
    .doc-title {
      margin: 0;
      padding: 8px 16px;
      border-bottom: 1px solid #111;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 1px solid #111;
    }
    .meta-cell { padding: 8px 16px; }
    .meta-cell + .meta-cell { border-left: 1px solid #111; }
    .k { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .v { margin-top: 2px; font-size: 13px; font-weight: 600; }
    .party { padding: 12px 16px; border-bottom: 1px solid #111; }
    .party h2 {
      margin: 0 0 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .party .name { font-size: 14px; font-weight: 700; }
    .party p { margin: 2px 0 0; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items th, table.items td {
      padding: 8px 12px;
      border-bottom: 1px solid #111;
      text-align: left;
      vertical-align: top;
    }
    table.items th {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: #f3f3f3;
    }
    table.items .num { text-align: right; width: 8.5rem; }
    .remarks, .note { padding: 12px 16px; }
    .remarks { min-height: 56px; border-bottom: 1px solid #111; }
    .remarks p, .note p { margin: 4px 0 0; }
    .signs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      padding: 36px 16px 16px;
    }
    .sign { padding-top: 28px; text-align: center; font-size: 11px; }
    .sign .line { border-top: 1px solid #111; padding-top: 6px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <article class="sheet">
    <header class="letterhead">
      ${logo}
      <div class="identity">
        <h1 class="org-name">${escapeHtml(issuer.name)}</h1>
        ${issuer.addressLines.length > 0 ? `<p class="org-meta">${htmlLines(issuer.addressLines)}</p>` : ""}
        ${contact.length > 0 ? `<p class="org-meta">${escapeHtml(contact.join("  ·  "))}</p>` : ""}
      </div>
    </header>
    <h2 class="doc-title">Cylinder return memo</h2>
    <div class="meta">
      <div class="meta-cell">
        <div class="k">Memo no.</div>
        <div class="v">${escapeHtml(record.return_number)}</div>
      </div>
      <div class="meta-cell">
        <div class="k">Return date</div>
        <div class="v">${escapeHtml(formatMemoDate(record.created_at))}</div>
      </div>
    </div>
    <section class="party">
      <h2>To</h2>
      <div class="name">${escapeHtml(record.company_name)}</div>
      <p>${escapeHtml(customerAddress || "—")}</p>
      <p><span class="k">GST no.</span> ${escapeHtml(gst || "—")}</p>
    </section>
    <table class="items">
      <thead>
        <tr>
          <th>Cylinder no.</th>
          <th>Product</th>
          <th class="num">No. of cylinders</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(record.cylinder_number)}</td>
          <td>${escapeHtml(record.product_name)}</td>
          <td class="num">${escapeHtml(String(record.cylinder_count))}</td>
        </tr>
      </tbody>
    </table>
    ${
      remarks
        ? `<section class="remarks"><div class="k">Remarks</div><p>${escapeHtml(remarks)}</p></section>`
        : ""
    }
    <section class="note">
      <p>This memo acknowledges return of the cylinders listed above.</p>
    </section>
    <div class="signs">
      <div class="sign"><div class="line">Received by</div></div>
      <div class="sign"><div class="line">For ${escapeHtml(issuer.name)}<br />Authorized signatory</div></div>
    </div>
  </article>
  <script>
    (function () {
      function go() { window.print(); }
      window.addEventListener("load", function () {
        var img = document.querySelector("img");
        if (!img || img.complete) { go(); return; }
        img.addEventListener("load", go, { once: true });
        img.addEventListener("error", go, { once: true });
      });
    })();
  </script>
</body>
</html>`;

  const printWindow = window.open("about:blank", "_blank");
  if (!printWindow) {
    return false;
  }
  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  return true;
}

export function usePrintCylinderReturnMemo() {
  const orgQuery = useOrganization();
  const brandingQuery = useAuthOrganizationBranding();

  return useCallback(
    (record: CylinderReturn) => {
      const stillLoading =
        !orgQuery.data &&
        !brandingQuery.data &&
        (orgQuery.isLoading || brandingQuery.isLoading);
      if (stillLoading) {
        toast.error("Organization details are still loading. Try again in a moment.");
        return;
      }
      const issuer = issuerFromOrganization(
        orgQuery.data,
        brandingQuery.data?.name,
        brandingQuery.data?.logo_url,
      );
      if (!printCylinderReturnMemo(record, issuer)) {
        toast.error("Allow pop-ups for this site to print the memo");
      }
    },
    [
      brandingQuery.data,
      brandingQuery.isLoading,
      orgQuery.data,
      orgQuery.isLoading,
    ],
  );
}
