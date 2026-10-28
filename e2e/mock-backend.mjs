import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ROLE_ID = "22222222-2222-4222-8222-222222222222";

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

  const tablePreferenceMatch = pathname.match(
    /\/users\/me\/table-preferences\/([a-z][a-z0-9_.]+)$/,
  );
  if (tablePreferenceMatch) {
    const tableKey = tablePreferenceMatch[1];
    if (method === "GET" || method === "DELETE") {
      sendJson(res, 200, {
        success: true,
        data: {
          table_key: tableKey,
          visible_columns: [],
          column_order: [],
          is_default: true,
        },
      });
      return;
    }
    if (method === "PUT") {
      const body = (await readBody(req)) ?? {};
      sendJson(res, 200, {
        success: true,
        data: {
          table_key: tableKey,
          visible_columns: body.visible_columns ?? [],
          column_order: body.column_order ?? [],
          is_default: false,
        },
      });
      return;
    }
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
