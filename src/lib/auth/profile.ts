import "server-only";

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

const API = "https://api.hotelandsafari.com/api/me";

export async function profileRequest(
  token: string,
  method: "GET" | "PATCH" = "GET",
  data?: Record<string, string>
) {
  return fetch(API, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(data
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
}

export function parseProfile(
  payload: unknown
): UserProfile | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const result = payload as Record<string, unknown>;

  if (
    result.success !== true ||
    !result.data ||
    typeof result.data !== "object"
  ) {
    return null;
  }

  const user = result.data as Record<string, unknown>;

  if (
    typeof user.id !== "number" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    typeof user.role !== "string" ||
    typeof user.is_active !== "boolean"
  ) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone:
      typeof user.phone === "string"
        ? user.phone
        : null,
    role: user.role,
    is_active: user.is_active,
    created_at:
      typeof user.created_at === "string"
        ? user.created_at
        : null,
    updated_at:
      typeof user.updated_at === "string"
        ? user.updated_at
        : null,
  };
}
