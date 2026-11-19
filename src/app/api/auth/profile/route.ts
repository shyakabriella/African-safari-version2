import { NextRequest } from "next/server";

import {
  reply,
  sameOrigin,
} from "@/lib/auth/server";

import {
  profileRequest,
  parseProfile,
} from "@/lib/auth/profile";

async function forward(
  token: string,
  method: "GET" | "PATCH",
  data?: Record<string, string>
) {
  try {
    const response = await profileRequest(
      token,
      method,
      data
    );

    const payload = await response.json()
      .catch(() => null);

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
      const errors: Record<string, string[]> = {};

      for (const field of ["name", "phone"]) {
        const values = payload?.errors?.[field];

        if (Array.isArray(values)) {
          errors[field] = values
            .filter(
              (value): value is string =>
                typeof value === "string"
            )
            .slice(0, 3)
            .map(value => value.slice(0, 300));
        }
      }

      return reply({
        success: false,
        message: "Please review your profile details.",
        errors,
      }, 422);
    }

    if (response.status === 429) {
      return reply({
        success: false,
        message: "Too many requests. Try again later.",
      }, 429);
    }

    if (!response.ok) {
      return reply({
        success: false,
        message: "Profile service temporarily unavailable.",
      }, 503);
    }

    const profile = parseProfile(payload);

    if (!profile || !profile.is_active) {
      return reply({
        success: false,
        message: "Unable to verify your profile.",
      }, 502);
    }

    return reply({
      success: true,
      data: profile,
      message: method === "PATCH"
        ? "Profile updated successfully."
        : "Profile retrieved successfully.",
    });

  } catch {
    return reply({
      success: false,
      message: "Unable to connect to profile service.",
    }, 503);
  }
}

export async function GET(request: NextRequest) {
  const token =
    request.cookies.get("afhbh_session")?.value;

  if (!token) {
    return reply({
      success: false,
      message: "Please sign in.",
    }, 401);
  }

  return forward(token, "GET");
}

export async function PATCH(request: NextRequest) {
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
      message: "Please sign in.",
    }, 401);
  }

  const body = await request.json()
    .catch(() => null);

  const allowed = ["name", "phone"];

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length === 0 ||
    Object.keys(body).some(
      field => !allowed.includes(field)
    )
  ) {
    return reply({
      success: false,
      message: "Unsupported profile fields.",
    }, 422);
  }

  const data: Record<string, string> = {};
  const errors: Record<string, string[]> = {};

  if (
    Object.prototype.hasOwnProperty.call(body, "name")
  ) {
    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      body.name.trim().length > 120
    ) {
      errors.name = ["Enter a valid full name."];
    } else {
      data.name = body.name.trim();
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(body, "phone")
  ) {
    if (
      typeof body.phone !== "string" ||
      !body.phone.trim() ||
      body.phone.trim().length > 40
    ) {
      errors.phone = ["Enter a valid phone number."];
    } else {
      data.phone = body.phone.trim();
    }
  }

  if (Object.keys(errors).length) {
    return reply({
      success: false,
      message: "Please correct your profile details.",
      errors,
    }, 422);
  }

  return forward(token, "PATCH", data);
}
