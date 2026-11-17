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
    !body.email.trim() ||
    body.email.length > 255 ||
    typeof body.otp !== "string" ||
    !/^\d{6}$/.test(body.otp)
  ) {
    return reply({
      message: "Please enter a valid verification code.",
    }, 422);
  }

  try {
    const response = await backendAuth("login/verify-otp", {
      email: body.email.trim(),
      otp: body.otp,
    });

    if (!response.ok) {
      return authError(response.status);
    }

    const data = await response.json();

    const token =
      data.token ??
      data.access_token ??
      data.data?.token ??
      data.data?.access_token;

    if (typeof token !== "string" || !token) {
      return reply({
        message: "Unable to establish an authenticated session.",
      }, 502);
    }

    const result = reply({ success: true });

    result.cookies.set({
      name: "afhbh_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return result;
  } catch {
    return reply({
      message: "Unable to verify your account.",
    }, 503);
  }
}
