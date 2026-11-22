import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { getAccountAccess } from "@/lib/auth/access";
import { reply, sameOrigin } from "@/lib/auth/server";

const API = "https://api.hotelandsafari.com/api/tours";

const categories = new Set([
  "game_drive",
  "gorilla_trekking",
  "hiking",
  "culture",
  "boat",
  "birding",
  "other",
]);

const currencies = new Set([
  "USD",
  "RWF",
  "EUR",
  "GBP",
  "KES",
  "UGX",
  "TZS",
]);

const allowedFields = new Set([
  "name",
  "description",
  "category",
  "duration_days",
  "duration_hours",
  "base_price",
  "currency",
  "group_size_min",
  "group_size_max",
  "start_point",
  "inclusions",
  "exclusions",
  "what_to_bring",
]);

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function validInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function optionalInteger(
  value: unknown,
  minimum: number,
  maximum: number,
) {
  return (
    value === undefined ||
    validInteger(value, minimum, maximum)
  );
}

function optionalString(
  value: unknown,
  maximum: number,
) {
  return (
    value === undefined ||
    (
      typeof value === "string" &&
      value.length <= maximum
    )
  );
}

function optionalStringArray(value: unknown) {
  return (
    value === undefined ||
    (
      Array.isArray(value) &&
      value.length <= 30 &&
      value.every(
        item =>
          typeof item === "string" &&
          item.trim().length > 0 &&
          item.length <= 300,
      )
    )
  );
}

function validateTour(body: JsonObject): string | null {
  if (
    Object.keys(body).some(
      key => !allowedFields.has(key),
    )
  ) {
    return "Unsupported Safari Tour fields.";
  }

  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.trim().length > 180
  ) {
    return "Enter a Safari Tour name (maximum 180 characters).";
  }

  if (!optionalString(body.description, 10000)) {
    return "Description is too long.";
  }

  if (
    body.category !== undefined &&
    (
      typeof body.category !== "string" ||
      !categories.has(body.category)
    )
  ) {
    return "Select a valid Safari Tour category.";
  }

  if (
    !optionalInteger(body.duration_days, 0, 3650) ||
    !optionalInteger(body.duration_hours, 0, 24)
  ) {
    return "Enter a valid Safari Tour duration.";
  }

  if (
    typeof body.base_price !== "string" ||
    !/^\d{1,10}(\.\d{1,2})?$/.test(body.base_price)
  ) {
    return "Enter a valid base price with up to two decimals.";
  }

  if (
    body.currency !== undefined &&
    (
      typeof body.currency !== "string" ||
      !currencies.has(body.currency)
    )
  ) {
    return "Select a supported currency.";
  }

  if (
    !optionalInteger(body.group_size_min, 1, 1000) ||
    !optionalInteger(body.group_size_max, 1, 1000)
  ) {
    return "Group sizes must be between 1 and 1000.";
  }

  const minimum = body.group_size_min;
  const maximum = body.group_size_max;

  if (
    typeof minimum === "number" &&
    typeof maximum === "number" &&
    maximum < minimum
  ) {
    return "Maximum group size must not be smaller than minimum.";
  }

  if (!optionalString(body.start_point, 190)) {
    return "Safari starting point is too long.";
  }

  if (
    !optionalStringArray(body.inclusions) ||
    !optionalStringArray(body.exclusions) ||
    !optionalStringArray(body.what_to_bring)
  ) {
    return "Safari inclusions and packing details are invalid.";
  }

  return null;
}

function safeTourPayload(body: JsonObject) {
  return {
    name: String(body.name).trim(),
    description:
      typeof body.description === "string"
        ? body.description.trim()
        : "",
    category:
      typeof body.category === "string"
        ? body.category
        : "other",
    duration_days:
      typeof body.duration_days === "number"
        ? body.duration_days
        : 1,
    duration_hours:
      typeof body.duration_hours === "number"
        ? body.duration_hours
        : 0,
    base_price: String(body.base_price),
    currency:
      typeof body.currency === "string"
        ? body.currency
        : "USD",
    ...(typeof body.group_size_min === "number"
      ? { group_size_min: body.group_size_min }
      : {}),
    ...(typeof body.group_size_max === "number"
      ? { group_size_max: body.group_size_max }
      : {}),
    ...(typeof body.start_point === "string" &&
    body.start_point.trim()
      ? { start_point: body.start_point.trim() }
      : {}),
    ...(Array.isArray(body.inclusions)
      ? {
          inclusions: body.inclusions.map(
            (item: string) => item.trim(),
          ),
        }
      : {}),
    ...(Array.isArray(body.exclusions)
      ? {
          exclusions: body.exclusions.map(
            (item: string) => item.trim(),
          ),
        }
      : {}),
    ...(Array.isArray(body.what_to_bring)
      ? {
          what_to_bring: body.what_to_bring.map(
            (item: string) => item.trim(),
          ),
        }
      : {}),
  };
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      success: false,
      message: "Request origin not allowed.",
    }, 403);
  }

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
    access.user.role !== "vendor"
  ) {
    return reply({
      success: false,
      message: "Safari Operator account required.",
    }, 403);
  }

  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    !contentType.toLowerCase().startsWith(
      "application/json",
    )
  ) {
    return reply({
      success: false,
      message: "JSON request required.",
    }, 415);
  }

  let body: unknown;

  try {
    const text = await request.text();

    if (text.length > 20000) {
      return reply({
        success: false,
        message: "Safari Tour request is too large.",
      }, 413);
    }

    body = JSON.parse(text);
  } catch {
    return reply({
      success: false,
      message: "Invalid JSON request.",
    }, 400);
  }

  if (!isRecord(body)) {
    return reply({
      success: false,
      message: "Invalid Safari Tour information.",
    }, 422);
  }

  const validationError = validateTour(body);

  if (validationError) {
    return reply({
      success: false,
      message: validationError,
    }, 422);
  }

  const token = (await cookies())
    .get("afhbh_session")?.value;

  if (!token) {
    return reply({
      success: false,
      message: "Please sign in again.",
    }, 401);
  }

  // Never accept vendor_id or status from the browser.
  // Laravel determines company ownership and forces draft.
  const payload = safeTourPayload(body);

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
          status === 401
            ? "Your session expired. Sign in again."
            : status === 403
              ? "An approved Safari Operator company is required."
              : status === 404
                ? "Register your Safari Company first."
                : status === 422 || status === 400
                  ? "Review your Safari Tour details."
                  : status === 429
                    ? "Too many requests. Try again later."
                    : "Safari Tour creation is temporarily unavailable.",
      }, (
        [400, 401, 403, 404, 422, 429].includes(status)
          ? status
          : 503
      ));
    }

    const result: unknown = await response.json();

    if (
      !isRecord(result) ||
      result.success !== true ||
      !isRecord(result.data) ||
      !validInteger(result.data.id, 1, 2147483647) ||
      result.data.status !== "draft"
    ) {
      return reply({
        success: false,
        message:
          "Creation outcome could not be verified. Refresh your Safari Tours before retrying.",
      }, 502);
    }

    return reply({
      success: true,
      data: {
        id: result.data.id,
        status: "draft",
      },
      message: "Draft Safari Tour created successfully.",
    }, 201);
  } catch {
    return reply({
      success: false,
      message:
        "Creation outcome is uncertain. Refresh your Safari Tours before submitting again.",
    }, 503);
  }
}
