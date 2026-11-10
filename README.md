# Aagman ERP front-end

Next.js App Router client for the Aagman ERP API: administration (users, roles, permissions, branches, departments, warehouses, organization settings, audit logs), company master, and inventory (units, materials, daily stock in/out).

## Development

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` to the backend API origin (see `.env.example` if present).

## Permissions catalog

After changing backend permission seeds, update `src/shared/lib/permissions-catalog.json` and run:

```bash
npm run generate:permissions
```
