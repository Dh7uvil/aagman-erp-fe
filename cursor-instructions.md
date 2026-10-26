# Cursor Instructions — Aagman ERP Front-end

Next.js App Router, React, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zod.

**Scope:** administration (users, roles, permissions, branches, departments, warehouses, organization settings, audit logs), company master, and inventory (units, material categories/subcategories, daily in/out).

The backend is the source of truth for permissions and business rules. The UI only hides or disables actions for usability.

## Architecture

```text
Route Segment → Feature Component → Query/Mutation Hook → slice api.ts → Backend /api/v1
```

List pages follow `.cursor/rules/list-page-layout.mdc` (see `departments-screen.tsx`).

## Instruction files

| File | Topic |
|------|--------|
| [adding-a-new-module](.github/instructions/adding-a-new-module.instructions.md) | New feature slices |
| [frontend-domain-boundaries](.github/instructions/frontend-domain-boundaries.instructions.md) | Auth, permissions, module boundaries |
| [api-client-and-data-fetching](.github/instructions/api-client-and-data-fetching.instructions.md) | API client and React Query |
| [ui-and-design-system](.github/instructions/ui-and-design-system.instructions.md) | Tables, forms, layout |

After changing permission seeds, update `src/shared/lib/permissions-catalog.json` and run `npm run generate:permissions`.
