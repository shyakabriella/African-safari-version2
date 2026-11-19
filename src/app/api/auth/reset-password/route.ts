import { NextRequest } from "next/server";

import {
  backendAuth,
  reply,
  sameOrigin,
} from "@/lib/auth/server";

const fields = [
  "email",
  "token",
  "password",
  "password_confirmation",
] as const;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      success: false,
      message: "Request not allowed.",
    }, 403);
  }

  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some(
      key => !fields.some(field => field === key)
    ) ||
    fields.some(field => typeof body[field] !== "string")
  ) {
    return reply({
      success: false,
      message: "Please complete all required fields.",
    }, 422);
  }

  const email = body.email.trim().toLowerCase();
  const token = body.token.trim();

  if (
    !email ||
    email.length > 190 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return reply({
      success: false,
      message: "Invalid email address.",
    }, 422);
  }

  if (!token || token.length > 512) {
    return reply({
      success: false,
      message: "Invalid or expired reset link.",
    }, 422);
  }

  if (
    body.password.length < 12 ||
    new TextEncoder().encode(body.password).length > 72
  ) {
    return reply({
      success: false,
      message:
        "Use at least 12 characters and no more than 72 bytes.",
    }, 422);
  }

  if (body.password !== body.password_confirmation) {
    return reply({
      success: false,
      message: "The passwords do not match.",
    }, 422);
  }

  try {
    const response = await backendAuth(
      "password/reset",
      {
        email,
        token,
        password: body.password,
        password_confirmation:
          body.password_confirmation,
      }
    );

    if (response.status === 429) {
      return reply({
        success: false,
        message:
          "Too many attempts. Please try again later.",
      }, 429);
    }

    if (response.status === 422) {
      return reply({
        success: false,
        message:
          "Invalid or expired reset link. Please request a new link.",
      }, 422);
    }

    if (!response.ok) {
      return reply({
        success: false,
        message:
          "Password reset is temporarily unavailable.",
      }, 503);
    }

    const result = await response.json().catch(() => null);

    if (result?.success !== true) {
      return reply({
        success: false,
        message: "Unable to reset your password.",
      }, 502);
    }

    const output = reply({
      success: true,
      message:
        "Password updated successfully. Please sign in again.",
    });

    // Laravel revokes the recovered account's API tokens.
    // Remove any existing frontend session cookie.
    output.cookies.set({
      name: "afhbh_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return output;

  } catch {
    return reply({
      success: false,
      message: "Unable to connect to the recovery service.",
    }, 503);
  }
}
