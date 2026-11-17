import { NextRequest, NextResponse } from "next/server";

const API = "https://api.hotelandsafari.com/api";

export function reply(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return false;
  }

  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function backendAuth(
  endpoint: "login" | "login/verify-otp",
  payload: Record<string, string>
) {
  return fetch(`${API}/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });
}

export function authError(status: number) {
  if (status === 429) {
    return reply({
      message: "Too many attempts. Please try again later.",
    }, 429);
  }

  if (status === 503 || status >= 500) {
    return reply({
      message: "Authentication is temporarily unavailable.",
    }, 503);
  }

  return reply({
    message: "Invalid credentials or verification code.",
  }, status >= 400 && status < 500 ? status : 400);
}
