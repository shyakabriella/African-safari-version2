import { NextRequest } from "next/server";

import {
  reply,
  sameOrigin,
} from "@/lib/auth/server";

import {
  sessionToken,
  sessionRequest,
  sessionError,
  clearSessionCookie,
} from "@/lib/auth/sessions";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return sessionError(403);
  }

  const token = sessionToken(request);

  if (!token) {
    return sessionError(401);
  }

  if (
    request.nextUrl.searchParams.size > 0 ||
    (await request.text()).length > 0
  ) {
    return sessionError(422);
  }

  try {
    const response = await sessionRequest(
      token,
      "logout-all",
      "POST"
    );

    if (!response.ok) {
      return sessionError(response.status);
    }

    const result = await response.json()
      .catch(() => null);

    if (result?.success !== true) {
      return reply({
        success: false,
        message: "Unable to confirm logout from all devices.",
      }, 502);
    }

    return clearSessionCookie(
      reply({
        success: true,
        message: "Logged out from all devices.",
      })
    );

  } catch {
    return sessionError(503);
  }
}
