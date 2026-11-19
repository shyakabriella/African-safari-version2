export const ROLE_CONFIG = {
  admin: {
    label: "Administrator",
    title: "Administration Dashboard",
    dashboard: "/dashboard",
    description:
      "Manage the African Safaris marketplace.",
  },
  customer: {
    label: "Customer",
    title: "Traveler Dashboard",
    dashboard: "/customer/dashboard",
    description:
      "Manage your African safari and accommodation experiences.",
  },
  vendor: {
    label: "Tour Operator",
    title: "Tour Operator Dashboard",
    dashboard: "/vendor/dashboard",
    description:
      "Manage your safari tours and marketplace operations.",
  },
  partner: {
    label: "Partner",
    title: "Partner Dashboard",
    dashboard: "/partner/dashboard",
    description:
      "Manage your marketplace partnership.",
  },
  agent: {
    label: "Agent",
    title: "Agent Dashboard",
    dashboard: "/agent/dashboard",
    description:
      "Access your agent workspace.",
  },
} as const;

export type AccountRole = keyof typeof ROLE_CONFIG;

export function isAccountRole(
  value: unknown
): value is AccountRole {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      ROLE_CONFIG,
      value
    )
  );
}

export function dashboardForRole(
  role: AccountRole
) {
  return ROLE_CONFIG[role].dashboard;
}
