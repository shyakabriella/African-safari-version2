import "server-only";

import { cookies } from "next/headers";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  isAccountRole,
  type AccountRole,
} from "@/lib/auth/roles";

const API =
  "https://api.hotelandsafari.com/api/admin/users";

export type DirectoryUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: AccountRole;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type DirectoryQuery = {
  search: string;
  role: AccountRole | null;
  is_active: "0" | "1" | null;
  page: number;
  per_page: number;
};

export type DirectoryPage = {
  users: DirectoryUser[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type DirectoryResult =
  | {
      ok: true;
      data: DirectoryPage;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

type QueryResult =
  | {
      ok: true;
      data: DirectoryQuery;
    }
  | {
      ok: false;
      message: string;
    };

function record(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function integer(
  value: unknown,
  minimum = 0
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum
  );
}

function dateValue(
  value: unknown
): value is string | null {
  return (
    value === null ||
    (
      typeof value === "string" &&
      value.length <= 100 &&
      Number.isFinite(Date.parse(value))
    )
  );
}

function validText(
  value: unknown,
  max: number
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= max
  );
}

function decimal(
  value: string,
  minimum: number,
  maximum: number
): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number < minimum ||
    number > maximum
  ) {
    return null;
  }

  return number;
}

export function parseDirectoryQuery(
  parameters: URLSearchParams
): QueryResult {

  const allowed = new Set([
    "search",
    "role",
    "is_active",
    "page",
    "per_page",
  ]);

  const seen = new Set<string>();

  for (const key of parameters.keys()) {
    if (!allowed.has(key)) {
      return {
        ok: false,
        message: "Unsupported query parameter.",
      };
    }

    if (seen.has(key)) {
      return {
        ok: false,
        message: "Duplicate query parameter.",
      };
    }

    seen.add(key);
  }

  const search =
    (parameters.get("search") ?? "").trim();

  if (
    search.length > 190 ||
    /[\u0000-\u001f\u007f]/.test(search)
  ) {
    return {
      ok: false,
      message: "Invalid search value.",
    };
  }

  const role = parameters.get("role");

  if (
    role !== null &&
    !isAccountRole(role)
  ) {
    return {
      ok: false,
      message: "Invalid account role.",
    };
  }

  const active = parameters.get("is_active");

  if (
    active !== null &&
    active !== "0" &&
    active !== "1"
  ) {
    return {
      ok: false,
      message: "Invalid account status.",
    };
  }

  const page = decimal(
    parameters.get("page") ?? "1",
    1,
    1000000
  );

  if (page === null) {
    return {
      ok: false,
      message: "Invalid page number.",
    };
  }

  const perPage = decimal(
    parameters.get("per_page") ?? "20",
    1,
    100
  );

  if (perPage === null) {
    return {
      ok: false,
      message: "Invalid page size.",
    };
  }

  return {
    ok: true,
    data: {
      search,
      role: role as AccountRole | null,
      is_active: active,
      page,
      per_page: perPage,
    },
  };
}

export function parseDirectoryUser(
  value: unknown
): DirectoryUser | null {

  if (!record(value)) return null;

  if (
    !integer(value.id, 1) ||
    !validText(value.name, 255) ||
    !validText(value.email, 255) ||
    (
      value.phone !== null &&
      (
        typeof value.phone !== "string" ||
        value.phone.length > 255
      )
    ) ||
    typeof value.role !== "string" ||
    !isAccountRole(value.role) ||
    typeof value.is_active !== "boolean" ||
    !dateValue(value.created_at) ||
    !dateValue(value.updated_at)
  ) {
    return null;
  }

  // Explicitly allow only approved account fields.
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    phone: value.phone,
    role: value.role as AccountRole,
    is_active: value.is_active,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

export function parseDirectoryPage(
  payload: unknown,
  query: DirectoryQuery
): DirectoryPage | null {

  if (
    !record(payload) ||
    payload.success !== true ||
    !record(payload.data)
  ) {
    return null;
  }

  const data = payload.data;

  if (
    !Array.isArray(data.data) ||
    !integer(data.current_page, 1) ||
    !integer(data.last_page, 1) ||
    !integer(data.per_page, 1) ||
    !integer(data.total)
  ) {
    return null;
  }

  if (
    data.current_page !== query.page ||
    data.per_page !== query.per_page ||
    data.per_page > 100 ||
    data.last_page !== Math.max(
      1,
      Math.ceil(data.total / data.per_page)
    )
  ) {
    return null;
  }

  const offset =
    (data.current_page - 1) * data.per_page;

  const expectedLength = Math.min(
    data.per_page,
    Math.max(0, data.total - offset)
  );

  if (data.data.length !== expectedLength) {
    return null;
  }

  const expectedFrom =
    expectedLength > 0 ? offset + 1 : null;

  const expectedTo =
    expectedLength > 0
      ? offset + expectedLength
      : null;

  if (
    data.from !== expectedFrom ||
    data.to !== expectedTo
  ) {
    return null;
  }

  const users: DirectoryUser[] = [];
  const ids = new Set<number>();

  for (const item of data.data) {
    const user = parseDirectoryUser(item);

    if (!user || ids.has(user.id)) {
      return null;
    }

    if (
      query.role !== null &&
      user.role !== query.role
    ) {
      return null;
    }

    if (
      query.is_active !== null &&
      user.is_active !==
        (query.is_active === "1")
    ) {
      return null;
    }

    ids.add(user.id);
    users.push(user);
  }

  return {
    users,
    current_page: data.current_page,
    last_page: data.last_page,
    per_page: data.per_page,
    total: data.total,
    from: expectedFrom,
    to: expectedTo,
  };
}

export async function getUsersDirectory(
  parameters: URLSearchParams
): Promise<DirectoryResult> {

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

  const parsed =
    parseDirectoryQuery(parameters);

  if (!parsed.ok) {
    return {
      ok: false,
      status: 422,
      message: parsed.message,
    };
  }

  const query = parsed.data;
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

  // Construct upstream parameters from validated fields.
  // Never forward arbitrary browser input.
  const upstream = new URLSearchParams();

  upstream.set(
    "page",
    String(query.page)
  );

  upstream.set(
    "per_page",
    String(query.per_page)
  );

  if (query.search) {
    upstream.set("search", query.search);
  }

  if (query.role !== null) {
    upstream.set("role", query.role);
  }

  if (query.is_active !== null) {
    upstream.set(
      "is_active",
      query.is_active
    );
  }

  try {
    const response = await fetch(
      `${API}?${upstream.toString()}`,
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

    if (response.status === 422) {
      return {
        ok: false,
        status: 422,
        message: "Invalid directory filters.",
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
          "Users directory is temporarily unavailable.",
      };
    }

    const payload =
      await response.json().catch(() => null);

    const directory =
      parseDirectoryPage(payload, query);

    if (!directory) {
      return {
        ok: false,
        status: 502,
        message:
          "Unable to verify the users directory.",
      };
    }

    return {
      ok: true,
      data: directory,
    };

  } catch {
    return {
      ok: false,
      status: 503,
      message:
        "Users directory is temporarily unavailable.",
    };
  }
}
