import "server-only";

import { cookies } from "next/headers";

import { getAccountAccess } from "@/lib/auth/access";
import { reply } from "@/lib/auth/server";

const API =
  "https://api.hotelandsafari.com/api/admin/safari-operator-applications";

export async function forwardOperatorApproval(
  path: string,
  method: "GET" | "PATCH" = "GET",
  body?: Record<string, string>,
) {
  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    return reply({
      success: false,
      message: "Please sign in again.",
    }, 401);
  }

  if (access.status === "unavailable") {
    return reply({
      success: false,
      message: "Account verification is unavailable.",
    }, 503);
  }

  if (
    access.status !== "authenticated" ||
    access.user.role !== "admin"
  ) {
    return reply({
      success: false,
      message: "Administrator access required.",
    }, 403);
  }

  const token = (await cookies())
    .get("afhbh_session")?.value;

  if (!token) {
    return reply({
      success: false,
      message: "Please sign in again.",
    }, 401);
  }

  try {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(method === "PATCH"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(method === "PATCH"
        ? { body: JSON.stringify(body ?? {}) }
        : {}),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const status = response.status;

      const allowed = [
        401, 403, 404, 409, 422, 429,
      ];

      return reply({
        success: false,
        message:
          status === 401
            ? "Your session has expired."
            : status === 403
              ? "Administrator access required."
              : status === 404
                ? "Safari Operator application not found."
                : status === 409
                  ? "This application is no longer pending. Refresh the list."
                  : status === 422
                    ? "Invalid application decision."
                    : status === 429
                      ? "Too many requests. Try again shortly."
                      : "Safari Operator approval service is unavailable.",
      }, allowed.includes(status) ? status : 503);
    }

    const payload: unknown = await response.json();

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload) ||
      !("success" in payload) ||
      payload.success !== true
    ) {
      throw new Error("Unexpected approval response.");
    }

    return reply({
      ...payload,
    });
  } catch {
    return reply({
      success: false,
      message: "Unable to contact the Safari Operator approval service.",
    }, 503);
  }
}
