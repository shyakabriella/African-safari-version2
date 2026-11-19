import { NextRequest } from "next/server";

import {
  backendAuth,
  reply,
  sameOrigin,
} from "@/lib/auth/server";

const fields = [
  "name",
  "email",
  "phone",
  "password",
  "password_confirmation",
  "role",
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
    Array.isArray(body)
  ) {
    return reply({
      success: false,
      message: "Invalid registration request.",
    }, 422);
  }

  const unexpected = Object.keys(body).filter(
    key => !fields.some(field => field === key)
  );

  if (unexpected.length > 0) {
    return reply({
      success: false,
      message: "Unsupported registration fields.",
    }, 422);
  }

  if (fields.some(field => typeof body[field] !== "string")) {
    return reply({
      success: false,
      message: "Please complete all required fields.",
    }, 422);
  }

  const payload = {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.trim(),
    password: body.password,
    password_confirmation: body.password_confirmation,
    role: body.role,
  };

  if (!["customer", "vendor"].includes(payload.role)) {
    return reply({
      success: false,
      message: "Invalid account type.",
    }, 422);
  }

  const errors: Record<string, string[]> = {};

  if (!payload.name || payload.name.length > 120) {
    errors.name = ["Please enter a valid full name."];
  }

  if (
    !payload.email ||
    payload.email.length > 190 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
  ) {
    errors.email = ["Please enter a valid email address."];
  }

  if (
    !payload.phone ||
    payload.phone.length > 40 ||
    !/^\+?[0-9\s().-]{7,40}$/.test(payload.phone)
  ) {
    errors.phone = ["Please enter a valid phone number."];
  }

  if (
    payload.password.length < 12 ||
    payload.password.length > 72 ||
    new TextEncoder().encode(payload.password).length > 72
  ) {
    errors.password = [
      "Use a password between 12 and 72 bytes.",
    ];
  }

  if (payload.password !== payload.password_confirmation) {
    errors.password_confirmation = [
      "The passwords do not match.",
    ];
  }

  if (Object.keys(errors).length > 0) {
    return reply({
      success: false,
      message: "Please correct the highlighted fields.",
      errors,
    }, 422);
  }

  try {
    const response = await backendAuth("register", payload);

    const result = await response.json().catch(() => null);

    if (response.ok && result?.success === true) {
      // Do not expose registration tokens or user internals.
      return reply({
        success: true,
        message: "Account created successfully. Please sign in.",
      }, 201);
    }

    if (response.status === 422) {
      const source = result?.errors ?? result?.data;
      const safeErrors: Record<string, string[]> = {};

      if (source && typeof source === "object") {
        for (const field of fields) {
          const value = source[field];

          if (Array.isArray(value)) {
            safeErrors[field] = value
              .filter(
                (item): item is string =>
                  typeof item === "string"
              )
              .slice(0, 3)
              .map(item => item.slice(0, 300));
          }
        }
      }

      return reply({
        success: false,
        message: "Please review your registration details.",
        errors: safeErrors,
      }, 422);
    }

    if (response.status === 429) {
      return reply({
        success: false,
        message: "Too many attempts. Please try again later.",
      }, 429);
    }

    return reply({
      success: false,
      message: response.status >= 500
        ? "Registration is temporarily unavailable."
        : "Unable to create your account.",
    }, response.status >= 500 ? 503 : 400);

  } catch {
    return reply({
      success: false,
      message: "Unable to connect to the registration service.",
    }, 503);
  }
}
