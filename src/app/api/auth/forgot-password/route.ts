import { NextRequest } from "next/server";

import {
  backendAuth,
  reply,
  sameOrigin,
} from "@/lib/auth/server";

const genericMessage =
  "If your account exists, password reset instructions will be sent to your email.";

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
    Object.keys(body).some(key => key !== "email") ||
    typeof body.email !== "string"
  ) {
    return reply({
      success: false,
      message: "Please enter your email address.",
    }, 422);
  }

  const email = body.email.trim().toLowerCase();

  if (
    !email ||
    email.length > 190 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return reply({
      success: false,
      message: "Please enter a valid email address.",
    }, 422);
  }

  try {
    const response = await backendAuth(
      "password/forgot",
      { email }
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
        message: "Please enter a valid email address.",
      }, 422);
    }

    if (!response.ok) {
      return reply({
        success: false,
        message:
          "Password recovery is temporarily unavailable.",
      }, 503);
    }

    const result = await response.json().catch(() => null);

    if (result?.success !== true) {
      return reply({
        success: false,
        message:
          "Password recovery is temporarily unavailable.",
      }, 503);
    }

    // Never reveal whether the account exists.
    return reply({
      success: true,
      message: genericMessage,
    });

  } catch {
    return reply({
      success: false,
      message:
        "Unable to connect to the recovery service.",
    }, 503);
  }
}
