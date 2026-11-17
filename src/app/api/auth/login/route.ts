import { NextRequest } from "next/server";
import {
  authError,
  backendAuth,
  reply,
  sameOrigin,
} from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({ message: "Request not allowed." }, 403);
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

    return reply({
      success: true,
      requiresOtp: true,
    });
  } catch {
    return reply({
      message: "Unable to connect to authentication service.",
    }, 503);
  }
}
