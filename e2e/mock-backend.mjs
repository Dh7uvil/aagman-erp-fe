import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ROLE_ID = "22222222-2222-4222-8222-222222222222";
const E2E_MATERIAL_ID = "33333333-3333-4333-8333-333333333333";
const PRODUCT_ID = "44444444-4444-4444-8444-444444444444";
const MICRON_ID = "55555555-5555-4555-8555-555555555555";
const COMPANY_ID = "66666666-6666-4666-8666-666666666666";
const ORG_ID = "77777777-7777-4777-8777-777777777777";
const SIZE_UNIT_ID = "88888888-8888-4888-8888-888888888888";
const UNIT_ID = "99999999-9999-4999-8999-999999999999";

const isoNow = new Date().toISOString();

const e2eMaterial = {
  id: E2E_MATERIAL_ID,
  company_id: COMPANY_ID,
  company_name: "E2E Company",
  product_id: PRODUCT_ID,
  product_name: "E2E Film",
  micron_id: MICRON_ID,
  micron_name: "12 micron",
  size: "1000",
  size_unit_id: SIZE_UNIT_ID,
  size_unit_code: "mm",
  size_label: "1000 mm",
  unit_id: UNIT_ID,
  unit_code: "kg",
  unit_name: "Kilogram",
  name: "E2E Film 12 1000",
  rolls_on_hand: "5",
  total_kg: "120",
  price_per_unit: null,
  price_unit_id: null,
  price_unit_code: null,
  avg_price_per_unit: null,
  is_active: true,
  created_at: isoNow,
  updated_at: isoNow,
};

const organization = {
  id: ORG_ID,
  name: "E2E Organization",
  timezone: "Asia/Kolkata",
  logo_url: null,
  industry: null,
  website: null,
  contact_email: "admin@example.com",
  phone: null,
  fiscal_year_start_month: 4,
  fiscal_year_start_day: 1,
  settings: { headquarters: null },
  users_count: 1,
  departments_count: 0,
  branches_count: 0,
  created_at: isoNow,
  updated_at: isoNow,
};

function dashboardDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  const toIso = (d) => d.toISOString().slice(0, 10);
  return { date_from: toIso(start), date_to: toIso(end) };
}

function emptyMaterialsDashboard() {
  const range = dashboardDateRange();
  return {
    ...range,
    kpis: {
      active_skus: 0,
      total_kg_on_hand: "0",
      out_of_stock_skus: 0,
      stock_value: null,
      valued_sku_count: 0,
      dead_stock_skus: 0,
    },
    movement_buckets: [],
    stock_by_product: [],
    reorder_watchlist: [],
    top_consumed: [],
    dead_stock: [],
  };
}

function emptyCylindersDashboard() {
  const range = dashboardDateRange();
  return {
    ...range,
    kpis: {
      active_cylinders: 0,
      paused_cylinders: 0,
      cylinders_in_circulation: 0,
      awaiting_return: 0,
      cylinder_cost_exposure: null,
    },
    status_breakdown: [],
    activity_buckets: [],
    top_companies: [],
    open_pauses: [],
  };
}

function emptyInksDashboard() {
  const range = dashboardDateRange();
  return {
    ...range,
    kpis: {
      active_lines: 0,
      total_qty_on_hand: "0",
      out_of_stock_lines: 0,
      stock_value: null,
      valued_line_count: 0,
      dead_stock_lines: 0,
    },
    movement_buckets: [],
    stock_by_company: [],
    top_consumed: [],
    dead_stock: [],
  };
}

function emptyAdhesivesDashboard() {
  const range = dashboardDateRange();
  return {
    ...range,
    kpis: {
      active_lines: 0,
      total_qty_on_hand: "0",
      out_of_stock_lines: 0,
      stock_value: null,
      valued_line_count: 0,
    },
    movement_buckets: [],
    stock_by_company: [],
    top_consumed: [],
  };
}

function emptySolventsDashboard() {
  const range = dashboardDateRange();
  return {
    ...range,
    kpis: {
      active_lines: 0,
      total_qty_on_hand: "0",
      out_of_stock_lines: 0,
      stock_value: null,
      valued_line_count: 0,
    },
    movement_buckets: [],
    stock_by_company: [],
    top_consumed: [],
  };
}

const materialHistorySummary = {
  company_id: COMPANY_ID,
  company_name: "E2E Company",
  size_label: "1000 mm",
  product_name: "E2E Film",
  micron_name: "12 micron",
  rolls_on_hand: "5",
  total_kg: "120",
  last_purchase_price: null,
  last_purchase_price_unit_code: null,
  last_purchase_date: null,
  last_purchase_rolls: null,
  avg_price_per_unit: null,
  price_unit_code: null,
};

const me = {
  id: USER_ID,
  name: "E2E Admin",
  email: "admin@example.com",
  phone: null,
  status: "ACTIVE",
  designation: null,
  branch_id: null,
  department_id: null,
  last_login_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  roles: [{ id: ROLE_ID, name: "Superadmin", is_system_role: true }],
  permissions: ["*"],
  branch: null,
  department: null,
};

function defaultTablePreference(tableKey, overrides = {}) {
  return {
    table_key: tableKey,
    visible_columns: ["name"],
    column_order: ["name"],
    is_default: true,
    export_visible_columns: ["name"],
    export_column_order: ["name"],
    export_format: null,
    export_is_default: true,
    ...overrides,
  };
}

const tokens = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function emptyList() {
  return { data: [], meta: { page: 1, page_size: 25, total: 0, total_pages: 1 } };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const { pathname } = url;
  const method = req.method ?? "GET";

  if (pathname === "/health" && method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  if (pathname === "/auth/login" && method === "POST") {
    await readBody(req);
    sendJson(res, 200, tokens);
    return;
  }

  if (pathname === "/auth/refresh" && method === "POST") {
    await readBody(req);
    sendJson(res, 200, tokens);
    return;
  }

  if (pathname === "/auth/logout" && method === "POST") {
    await readBody(req);
    sendJson(res, 200, null);
    return;
  }

  if (pathname === "/auth/me" && method === "GET") {
    sendJson(res, 200, me);
    return;
  }

  const tablePreferenceExportMatch = pathname.match(
    /\/users\/me\/table-preferences\/([a-z][a-z0-9_.]+)\/export$/,
  );
  if (tablePreferenceExportMatch) {
    const tableKey = tablePreferenceExportMatch[1];
    if (method === "DELETE") {
      sendJson(res, 200, {
        success: true,
        data: defaultTablePreference(tableKey, { export_is_default: true }),
      });
      return;
    }
    if (method === "PUT") {
      const body = (await readBody(req)) ?? {};
      sendJson(res, 200, {
        success: true,
        data: {
          ...defaultTablePreference(tableKey, { is_default: false, export_is_default: false }),
          export_visible_columns: body.export_visible_columns ?? [],
          export_column_order: body.export_column_order ?? [],
          export_format: body.export_format ?? null,
        },
      });
      return;
    }
  }

  const tablePreferenceMatch = pathname.match(
    /\/users\/me\/table-preferences\/([a-z][a-z0-9_.]+)$/,
  );
  if (tablePreferenceMatch) {
    const tableKey = tablePreferenceMatch[1];
    if (method === "GET" || method === "DELETE") {
      sendJson(res, 200, {
        success: true,
        data: defaultTablePreference(tableKey, {
          is_default: method === "GET",
          export_is_default: true,
        }),
      });
      return;
    }
    if (method === "PUT") {
      const body = (await readBody(req)) ?? {};
      sendJson(res, 200, {
        success: true,
        data: {
          ...defaultTablePreference(tableKey, { is_default: false, export_is_default: true }),
          visible_columns: body.visible_columns ?? [],
          column_order: body.column_order ?? [],
        },
      });
      return;
    }
  }

  if (pathname === "/audit-logs/summary" && method === "GET") {
    sendJson(res, 200, {
      total_events: 0,
      unique_users: 0,
      failed_attempts: 0,
      admin_actions: 0,
      modules: [],
    });
    return;
  }

  if (pathname === "/organization" && method === "GET") {
    sendJson(res, 200, organization);
    return;
  }

  if (pathname === "/organization/branding" && method === "GET") {
    sendJson(res, 200, { name: organization.name, logo_url: null });
    return;
  }

  const dashboardMatch = pathname.match(
    /^\/inventory\/dashboard\/(materials|cylinders|inks|adhesives|solvents)$/,
  );
  if (dashboardMatch && method === "GET") {
    const section = dashboardMatch[1];
    const payload =
      section === "materials"
        ? emptyMaterialsDashboard()
        : section === "cylinders"
          ? emptyCylindersDashboard()
          : section === "inks"
            ? emptyInksDashboard()
            : section === "adhesives"
              ? emptyAdhesivesDashboard()
              : emptySolventsDashboard();
    sendJson(res, 200, payload);
    return;
  }

  const materialSubcategoryMatch = pathname.match(
    /^\/inventory\/material-subcategories\/([^/]+)(?:\/(history(?:-summary)?))?$/,
  );
  if (materialSubcategoryMatch && method === "GET") {
    const id = materialSubcategoryMatch[1];
    const sub = materialSubcategoryMatch[2];
    if (id !== E2E_MATERIAL_ID) {
      sendJson(res, 404, { message: "Not found" });
      return;
    }
    if (sub === "history-summary") {
      sendJson(res, 200, materialHistorySummary);
      return;
    }
    if (sub === "history") {
      sendJson(res, 200, emptyList());
      return;
    }
    sendJson(res, 200, e2eMaterial);
    return;
  }

  if (pathname === "/inventory/microns" && method === "GET") {
    sendJson(res, 200, {
      data: [
        {
          id: MICRON_ID,
          product_id: PRODUCT_ID,
          product_name: "E2E Film",
          name: "12 micron",
          price_per_unit: null,
          price_unit_id: null,
          price_unit_code: "kg",
          avg_price_per_unit: null,
          is_active: true,
          created_at: isoNow,
          updated_at: isoNow,
        },
      ],
      meta: { page: 1, page_size: 25, total: 1, total_pages: 1 },
    });
    return;
  }

  if (pathname === "/users" && method === "GET") {
    sendJson(res, 200, {
      data: [
        {
          id: USER_ID,
          name: "E2E Admin",
          email: "admin@example.com",
          phone: null,
          status: "ACTIVE",
          designation: "Administrator",
          branch_id: null,
          department_id: null,
          last_login_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: ROLE_ID, name: "Superadmin", is_system_role: true }],
          branch: null,
          department: null,
        },
      ],
      meta: { page: 1, page_size: 25, total: 1, total_pages: 1 },
    });
    return;
  }

  if (method === "GET") {
    sendJson(res, 200, emptyList());
    return;
  }

  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    sendJson(res, 200, { id: randomUUID() });
    return;
  }

  sendJson(res, 404, { message: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Mock API listening on http://127.0.0.1:${PORT}`);
});
