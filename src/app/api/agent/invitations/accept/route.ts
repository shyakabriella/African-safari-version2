import { NextRequest } from "next/server";
import { backendAuth, reply, sameOrigin } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      success: false,
      message: "Request not allowed.",
    }, 403);
  }

  const data = await request.json().catch(() => null);

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).some(key =>
      !["email", "token", "password", "password_confirmation"].includes(key)
    ) ||
    typeof data.email !== "string" ||
    typeof data.token !== "string" ||
    typeof data.password !== "string" ||
    typeof data.password_confirmation !== "string"
  ) {
    return reply({
      success: false,
      message: "Invalid invitation details.",
    }, 422);
  }

  if (
    data.email.length > 190 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    !/^[a-f0-9]{64}$/.test(data.token) ||
    data.password.length < 12 ||
    new TextEncoder().encode(data.password).length > 72 ||
    data.password !== data.password_confirmation
  ) {
    return reply({
      success: false,
      message: "Please check your invitation and password.",
    }, 422);
  }

  try {
    const response = await backendAuth(
      "agent/invitations/accept",
      {
        email: data.email.trim().toLowerCase(),
        token: data.token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      }
    );

    if (response.status === 422) {
      return reply({
        success: false,
        message: "Invitation is invalid or expired.",
      }, 422);
    }

    if (!response.ok) {
      return reply({
        success: false,
        message: "Activation is temporarily unavailable.",
      }, response.status === 429 ? 429 : 503);
    }

    const result = await response.json().catch(() => null);

    if (result?.success !== true) {
      return reply({
        success: false,
        message: "Activation could not be confirmed.",
      }, 502);
    }

    return reply({
      success: true,
      message: "Password set. You can now sign in.",
    });
  } catch {
    return reply({
      success: false,
      message: "Unable to connect to the activation service.",
    }, 503);
  }
}
