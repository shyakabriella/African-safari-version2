import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { getAccountAccess } from "@/lib/auth/access";
import { reply, sameOrigin } from "@/lib/auth/server";

const API = "https://api.hotelandsafari.com/api/tours";

function record(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function positiveInteger(
  value: unknown,
  max: number,
): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 1 &&
    value <= max;
}

function optionalInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): boolean {
  return value === undefined ||
    (
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= minimum &&
      value <= maximum
    );
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      success: false,
      message: "Invalid request origin.",
    }, 403);
  }

  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    return reply({
      success: false,
      message: "Please sign in.",
    }, 401);
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

  const type = request.headers.get("content-type") ?? "";

  if (!type.toLowerCase().startsWith("application/json")) {
    return reply({
      success: false,
      message: "JSON request required.",
    }, 415);
  }

  let payload: unknown;

  try {
    const text = await request.text();

    if (text.length > 10000) {
      return reply({
        success: false,
        message: "Request exceeds size limit.",
      }, 413);
    }

    payload = JSON.parse(text);
  } catch {
    return reply({
      success: false,
      message: "Invalid JSON request.",
    }, 400);
  }

  if (!record(payload)) {
    return reply({
      success: false,
      message: "Invalid tour information.",
    }, 422);
  }

  const allowed = new Set([
    "vendor_id",
    "name",
    "description",
    "category",
    "duration_days",
    "duration_hours",
    "base_price",
    "currency",
    "group_size_min",
    "group_size_max",
    "status",
  ]);

  if (Object.keys(payload).some(
    key => !allowed.has(key)
  )) {
    return reply({
      success: false,
      message: "Unsupported tour field.",
    }, 422);
  }

  const categories = new Set([
    "game_drive",
    "gorilla_trekking",
    "hiking",
    "culture",
    "boat",
    "birding",
    "other",
  ]);

  const valid =
    positiveInteger(payload.vendor_id, 2147483647) &&
    typeof payload.name === "string" &&
    payload.name.trim().length > 0 &&
    payload.name.length <= 180 &&
    (
      payload.description === undefined ||
      (
        typeof payload.description === "string" &&
        payload.description.length <= 10000
      )
    ) &&
    typeof payload.category === "string" &&
    categories.has(payload.category) &&
    optionalInteger(payload.duration_days, 0, 3650) &&
    optionalInteger(payload.duration_hours, 0, 24) &&
    typeof payload.base_price === "string" &&
    /^\d{1,10}(\.\d{1,2})?$/.test(
      payload.base_price
    ) &&
    typeof payload.currency === "string" &&
    /^[A-Z]{3}$/.test(payload.currency) &&
    optionalInteger(payload.group_size_min, 1, 1000) &&
    optionalInteger(payload.group_size_max, 1, 1000) &&
    payload.status === "draft";

  if (!valid) {
    return reply({
      success: false,
      message: "Please check your safari tour details.",
    }, 422);
  }

  const minimum = payload.group_size_min as
    number | undefined;

  const maximum = payload.group_size_max as
    number | undefined;

  if (
    minimum !== undefined &&
    maximum !== undefined &&
    maximum < minimum
  ) {
    return reply({
      success: false,
      message: "Maximum group size must be at least the minimum.",
    }, 422);
  }

  const store = await cookies();
  const token = store.get("afhbh_session")?.value;

  if (!token) {
    return reply({
      success: false,
      message: "Please sign in again.",
    }, 401);
  }

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const status = response.status;

      return reply({
        success: false,
        message:
          status === 422 || status === 400
            ? "Tour details were rejected. Check the vendor ID and input values."
            : status === 401
              ? "Your session has expired."
              : status === 403
                ? "Administrator permission was denied."
                : status === 429
                  ? "Too many requests. Try again later."
                  : "Tour creation is temporarily unavailable.",
      }, (
        [400, 401, 403, 422, 429].includes(status)
          ? status
          : 503
      ));
    }

    const result: unknown = await response.json();

    if (
      !record(result) ||
      result.success !== true ||
      !record(result.data) ||
      !positiveInteger(result.data.id, 2147483647)
    ) {
      return reply({
        success: false,
        message: "The backend response could not be verified. Refresh the tour list before retrying.",
      }, 502);
    }

    return reply({
      success: true,
      data: {
        id: result.data.id,
      },
      message: "Draft safari tour created.",
    }, 201);
  } catch {
    return reply({
      success: false,
      message: "The request outcome could not be confirmed. Refresh the tour list before retrying.",
    }, 503);
  }
}
