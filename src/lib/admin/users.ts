import "server-only";

import { cookies } from "next/headers";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  ROLE_CONFIG,
  type AccountRole,
} from "@/lib/auth/roles";

const API =
  "https://api.hotelandsafari.com/api/admin/users";

export type RoleStatistics = {
  total: number;
  active: number;
  inactive: number;
};

export type UserSummary = {
  total_users: number;
  active_users: number;
  inactive_users: number;
  by_role: Record<AccountRole, RoleStatistics>;
};

export type SummaryResult =
  | {
      ok: true;
      data: UserSummary;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

function countValue(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function objectValue(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export function parseUserSummary(
  payload: unknown
): UserSummary | null {
  if (
    !objectValue(payload) ||
    payload.success !== true ||
    !objectValue(payload.data)
  ) {
    return null;
  }

  const data = payload.data;

  if (
    !countValue(data.total_users) ||
    !countValue(data.active_users) ||
    !countValue(data.inactive_users) ||
    !objectValue(data.by_role)
  ) {
    return null;
  }

  if (
    data.total_users !==
    data.active_users + data.inactive_users
  ) {
    return null;
  }

  const roles = Object.keys(
    ROLE_CONFIG
  ) as AccountRole[];

  const byRole = {} as Record<
    AccountRole,
    RoleStatistics
  >;

  let total = 0;
  let active = 0;
  let inactive = 0;

  if (
    Object.keys(data.by_role).length !==
    roles.length
  ) {
    return null;
  }

  for (const role of roles) {
    const item = data.by_role[role];

    if (
      !objectValue(item) ||
      !countValue(item.total) ||
      !countValue(item.active) ||
      !countValue(item.inactive)
    ) {
      return null;
    }

    if (
      item.total !==
      item.active + item.inactive
    ) {
      return null;
    }

    byRole[role] = {
      total: item.total,
      active: item.active,
      inactive: item.inactive,
    };

    total += item.total;
    active += item.active;
    inactive += item.inactive;
  }

  if (
    total !== data.total_users ||
    active !== data.active_users ||
    inactive !== data.inactive_users
  ) {
    return null;
  }

  // Explicit allowlist prevents unexpected upstream
  // information from being sent to the browser.
  return {
    total_users: data.total_users,
    active_users: data.active_users,
    inactive_users: data.inactive_users,
    by_role: byRole,
  };
}

export async function getUserSummary():
  Promise<SummaryResult> {

  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    return {
      ok: false,
      status: 401,
      message: "Please sign in again.",
    };
  }

  if (access.status === "unavailable") {
    return {
      ok: false,
      status: 503,
      message:
        "Account verification is temporarily unavailable.",
    };
  }

  if (
    access.status !== "authenticated" ||
    access.user.role !== "admin"
  ) {
    return {
      ok: false,
      status: 403,
      message: "Administrator access required.",
    };
  }

  const store = await cookies();

  const token =
    store.get("afhbh_session")?.value;

  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Please sign in again.",
    };
  }

  try {
    const response = await fetch(
      `${API}/summary`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (response.status === 401) {
      return {
        ok: false,
        status: 401,
        message: "Please sign in again.",
      };
    }

    if (response.status === 403) {
      return {
        ok: false,
        status: 403,
        message: "Administrator access required.",
      };
    }

    if (response.status === 429) {
      return {
        ok: false,
        status: 429,
        message:
          "Too many requests. Please try again later.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: 503,
        message:
          "User statistics are temporarily unavailable.",
      };
    }

    const summary = parseUserSummary(
      await response.json().catch(() => null)
    );

    if (!summary) {
      return {
        ok: false,
        status: 502,
        message:
          "Unable to verify user statistics.",
      };
    }

    return {
      ok: true,
      data: summary,
    };

  } catch {
    return {
      ok: false,
      status: 503,
      message:
        "User statistics are temporarily unavailable.",
    };
  }
}
