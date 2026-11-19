import "server-only";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { reply } from "@/lib/auth/server";

const API = "https://api.hotelandsafari.com/api";

export type AccountSession = {
  id: number;
  name: string;
  created_at: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  is_current: boolean;
};

type SessionEndpoint =
  | "me/sessions"
  | `me/sessions/${number}`
  | "logout-all";

export function sessionToken(request: NextRequest) {
  return request.cookies.get("afhbh_session")?.value;
}

export async function sessionRequest(
  token: string,
  endpoint: SessionEndpoint,
  method: "GET" | "DELETE" | "POST"
) {
  return fetch(`${API}/${endpoint}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
}

export function sessionError(status: number) {
  const messages: Record<number, string> = {
    401: "Please sign in again.",
    403: "Account access denied.",
    404: "Session not found.",
    422: "Invalid session request.",
    429: "Too many requests. Try again later.",
  };

  if (messages[status]) {
    return reply({
      success: false,
      message: messages[status],
    }, status);
  }

  return reply({
    success: false,
    message: "Session service temporarily unavailable.",
  }, 503);
}

export function clearSessionCookie(
  response: NextResponse
) {
  response.cookies.set({
    name: "afhbh_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function parseSessions(
  payload: unknown
): AccountSession[] | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const result = payload as Record<string, unknown>;

  if (
    result.success !== true ||
    !Array.isArray(result.data)
  ) {
    return null;
  }

  const sessions: AccountSession[] = [];
  const ids = new Set<number>();

  for (const value of result.data) {
    if (!value || typeof value !== "object") {
      return null;
    }

    if (
      !Number.isSafeInteger(value.id) ||
      value.id <= 0 ||
      ids.has(value.id) ||
      typeof value.name !== "string" ||
      typeof value.is_current !== "boolean"
    ) {
      return null;
    }

    for (const field of [
      "created_at",
      "last_used_at",
      "expires_at",
    ]) {
      if (
        value[field] !== null &&
        (
          typeof value[field] !== "string" ||
          !Number.isFinite(Date.parse(value[field]))
        )
      ) {
        return null;
      }
    }

    ids.add(value.id);

    sessions.push({
      id: value.id,
      name: value.name,
      created_at: value.created_at,
      last_used_at: value.last_used_at,
      expires_at: value.expires_at,
      is_current: value.is_current,
    });
  }

  if (
    sessions.filter(s => s.is_current).length !== 1
  ) {
    return null;
  }

  return sessions;
}
