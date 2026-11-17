import { NextRequest } from "next/server";
import {
  authError,
  backendAuth,
  reply,
  sameOrigin,
} from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      message: "Request not allowed.",
    }, 403);
  }

  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    !body.email.trim() ||
    body.email.length > 255 ||
    !body.password ||
    body.password.length > 1024
  ) {
    return reply({
      message: "Please enter your email and password.",
    }, 422);
  }

  try {
    const response = await backendAuth("login", {
      email: body.email.trim(),
      password: body.password,
    });

    if (!response.ok) {
      return authError(response.status);
    }

    const payload = await response.json();

    if (payload?.success !== true) {
      return reply({
        message: "Unable to authenticate your account.",
      }, 502);
    }

    const data = payload.data;

    if (!data || typeof data !== "object") {
      return reply({
        message: "Unexpected authentication response.",
      }, 502);
    }

    // OTP is enabled.
    if (data.otp_required === true) {
      return reply({
        success: true,
        requiresOtp: true,
      });
    }

    // OTP is disabled: establish authenticated session.
    if (
      data.otp_required === false &&
      typeof data.token === "string" &&
      data.token.length > 0
    ) {
      const result = reply({
        success: true,
        requiresOtp: false,
      });

      result.cookies.set({
        name: "afhbh_session",
        value: data.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return result;
    }

    return reply({
      message: "Unable to establish an authenticated session.",
    }, 502);

  } catch {
    return reply({
      message: "Unable to connect to authentication service.",
    }, 503);
  }
}
