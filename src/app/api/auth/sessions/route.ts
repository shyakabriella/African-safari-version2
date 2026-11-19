import { NextRequest } from "next/server";
import { reply } from "@/lib/auth/server";

import {
  sessionToken,
  sessionRequest,
  sessionError,
  parseSessions,
} from "@/lib/auth/sessions";

export async function GET(request: NextRequest) {
  const token = sessionToken(request);

  if (!token) {
    return sessionError(401);
  }

  try {
    const response = await sessionRequest(
      token,
      "me/sessions",
      "GET"
    );

    if (!response.ok) {
      return sessionError(response.status);
    }

    const sessions = parseSessions(
      await response.json().catch(() => null)
    );

    if (!sessions) {
      return reply({
        success: false,
        message: "Unable to verify session information.",
      }, 502);
    }

    return reply({
      success: true,
      data: sessions,
    });

  } catch {
    return sessionError(503);
  }
}
