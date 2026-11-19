import { NextRequest } from "next/server";

import {
  reply,
  sameOrigin,
} from "@/lib/auth/server";

const API =
  "https://api.hotelandsafari.com/api/me/password";

const fields = [
  "current_password",
  "password",
  "password_confirmation",
] as const;

export async function PUT(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      success: false,
      message: "Request not allowed.",
    }, 403);
  }

  const token =
    request.cookies.get("afhbh_session")?.value;

  if (!token) {
    return reply({
      success: false,
      message: "Please sign in again.",
    }, 401);
  }

  const body = await request.json()
    .catch(() => null);

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some(
      key => !fields.some(field => field === key)
    ) ||
    fields.some(
      field => typeof body[field] !== "string"
    )
  ) {
    return reply({
      success: false,
      message: "Please complete all password fields.",
    }, 422);
  }

  const currentPassword = body.current_password;
  const password = body.password;
  const confirmation = body.password_confirmation;

  if (
    !currentPassword ||
    new TextEncoder().encode(currentPassword).length > 1024
  ) {
    return reply({
      success: false,
      message: "Please provide your current password.",
    }, 422);
  }

  if (
    Array.from(password).length < 12 ||
    new TextEncoder().encode(password).length > 72
  ) {
    return reply({
      success: false,
      message:
        "Use at least 12 characters and no more than 72 bytes.",
    }, 422);
  }

  if (password !== confirmation) {
    return reply({
      success: false,
      message: "The new passwords do not match.",
    }, 422);
  }

  if (password === currentPassword) {
    return reply({
      success: false,
      message:
        "Your new password must differ from your current password.",
    }, 422);
  }

  try {
    const response = await fetch(API, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        password,
        password_confirmation: confirmation,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });

    if (response.status === 401) {
      return reply({
        success: false,
        message: "Your session has expired.",
      }, 401);
    }

    if (response.status === 403) {
      return reply({
        success: false,
        message: "Account access denied.",
      }, 403);
    }

    if (response.status === 422) {
      return reply({
        success: false,
        message:
          "Current password is incorrect or the new password was rejected.",
      }, 422);
    }

    if (response.status === 429) {
      return reply({
        success: false,
        message:
          "Too many attempts. Please try again later.",
      }, 429);
    }

    if (!response.ok) {
      return reply({
        success: false,
        message:
          "Password service temporarily unavailable.",
      }, 503);
    }

    const result = await response.json()
      .catch(() => null);

    if (result?.success !== true) {
      return reply({
        success: false,
        message:
          "Unable to confirm your password change. Please sign in again if your session has expired.",
      }, 502);
    }

    const output = reply({
      success: true,
      message:
        "Password changed successfully. Please sign in again.",
    });

    // Laravel revokes all account tokens.
    // Remove the current frontend session cookie.
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
      message:
        "Unable to confirm the password change. Check your connection.",
    }, 503);
  }
}
