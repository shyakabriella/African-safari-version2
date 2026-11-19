import { NextRequest } from "next/server";

import {
  reply,
  sameOrigin,
} from "@/lib/auth/server";

import {
  sessionToken,
  sessionRequest,
  sessionError,
  parseSessions,
  clearSessionCookie,
} from "@/lib/auth/sessions";

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  if (!sameOrigin(request)) {
    return sessionError(403);
  }

  const token = sessionToken(request);

  if (!token) {
    return sessionError(401);
  }

  const { id } = await context.params;

  if (
    !/^[1-9][0-9]{0,15}$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return sessionError(422);
  }

  if (
    request.nextUrl.searchParams.size > 0 ||
    (await request.text()).length > 0
  ) {
    return sessionError(422);
  }

  try {
    const listResponse = await sessionRequest(
      token,
      "me/sessions",
      "GET"
    );

    if (!listResponse.ok) {
      return sessionError(listResponse.status);
    }

    const sessions = parseSessions(
      await listResponse.json().catch(() => null)
    );

    if (!sessions) {
      return sessionError(503);
    }

    const selected = sessions.find(
      session => session.id === Number(id)
    );

    if (!selected) {
      return sessionError(404);
    }

    // Laravel independently validates ownership.
    const response = await sessionRequest(
      token,
      `me/sessions/${Number(id)}`,
      "DELETE"
    );

    if (!response.ok) {
      return sessionError(response.status);
    }

    const result = await response.json()
      .catch(() => null);

    if (result?.success !== true) {
      return reply({
        success: false,
        message: "Unable to confirm session revocation.",
      }, 502);
    }

    const output = reply({
      success: true,
      current_session_revoked: selected.is_current,
      message: "Session revoked successfully.",
    });

    return selected.is_current
      ? clearSessionCookie(output)
      : output;

  } catch {
    return sessionError(503);
  }
}
