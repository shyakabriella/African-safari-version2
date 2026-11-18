import { NextRequest, NextResponse } from "next/server";

import { reply, sameOrigin } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      message: "Request not allowed.",
    }, 403);
  }

  const token = request.cookies.get("afhbh_session")?.value;

  if (token) {
    try {
      const response = await fetch(
        "https://api.hotelandsafari.com/api/logout",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!response.ok && response.status !== 401) {
        return reply({
          message: "Unable to complete logout. Please retry.",
        }, 503);
      }

    } catch {
      return reply({
        message: "Authentication service temporarily unavailable.",
      }, 503);
    }
  }

  const result = new NextResponse(null, {
    status: 303,
    headers: {
      Location: "/login",
      "Cache-Control": "no-store",
    },
  });

  result.cookies.set({
    name: "afhbh_session",
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return result;
}
