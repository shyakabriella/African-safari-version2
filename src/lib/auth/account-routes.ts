export const ADMIN_ACCOUNT_ROUTES = {
  profile: "/dashboard/profile",
  changePassword: "/dashboard/profile/change-password",
  sessions: "/dashboard/profile/sessions",
} as const;

export const SHARED_ACCOUNT_ROUTES = {
  profile: "/account/profile",
  changePassword: "/account/change-password",
  sessions: "/account/sessions",
} as const;

export function accountRoutesForRole(role: string) {
  return role === "admin"
    ? ADMIN_ACCOUNT_ROUTES
    : SHARED_ACCOUNT_ROUTES;
}
