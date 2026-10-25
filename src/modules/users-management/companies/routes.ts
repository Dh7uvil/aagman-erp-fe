export const companyRoutes = {
  list: "/companies",
  new: "/companies/new",
  view: (id: string) => `/companies/${id}`,
  edit: (id: string) => `/companies/${id}/edit`,
} as const;
