import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { getAccountAccess } from "@/lib/auth/access";
import { reply } from "@/lib/auth/server";

const API =
  "https://api.hotelandsafari.com/api/vendor/my-tours";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function integerInRange(
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

function parseTour(value: unknown) {
  if (!isRecord(value)) return null;

  if (
    !integerInRange(value.id, 1, 2147483647) ||
    !integerInRange(value.vendor_id, 1, 2147483647) ||
    typeof value.name !== "string" ||
    value.name.length === 0 ||
    typeof value.category !== "string" ||
    !["game_drive", "gorilla_trekking", "hiking",
      "culture", "boat", "birding", "other"]
      .includes(value.category) ||
    !["draft", "active", "inactive"].includes(
      String(value.status),
    ) ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency)
  ) {
    return null;
  }

  const price = value.base_price;

  if (
    (typeof price !== "number" &&
      typeof price !== "string") ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return null;
  }

  const days = value.duration_days;
  const hours = value.duration_hours;

  if (
    (days !== null &&
      days !== undefined &&
      !integerInRange(days, 0, 3650)) ||
    (hours !== null &&
      hours !== undefined &&
      !integerInRange(hours, 0, 24))
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    category: value.category,
    status: value.status,
    base_price: Number(price),
    currency: value.currency,
    duration_days: days ?? null,
    duration_hours: hours ?? null,
  };
}

function parsePositiveQuery(
  value: string | null,
  maximum: number,
  fallback: number,
): number | null {
  if (value === null) return fallback;

  if (!/^[1-9][0-9]*$/.test(value)) {
    return null;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) &&
    number <= maximum
    ? number
    : null;
}

export async function GET(request: NextRequest) {
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
      message: "Safari operator access required.",
    }, 403);
  }

  const params = request.nextUrl.searchParams;

  for (const key of params.keys()) {
    if (key !== "page" && key !== "per_page") {
      return reply({
        success: false,
        message: "Unsupported search parameter.",
      }, 422);
    }

    if (params.getAll(key).length !== 1) {
      return reply({
        success: false,
        message: "Duplicate search parameters are not allowed.",
      }, 422);
    }
  }

  const page = parsePositiveQuery(
    params.get("page"),
    100000,
    1,
  );

  const perPage = parsePositiveQuery(
    params.get("per_page"),
    50,
    10,
  );

  if (page === null || perPage === null) {
    return reply({
      success: false,
      message: "Invalid pagination parameters.",
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

  const upstream = new URL(API);

  upstream.searchParams.set("page", String(page));
  upstream.searchParams.set(
    "per_page",
    String(perPage),
  );

  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const status = response.status;

      return reply({
        success: false,
        message:
          status === 401
            ? "Your session has expired."
            : status === 403
              ? "Safari operator permission denied."
              : status === 422
                ? "Invalid tour list request."
                : status === 429
                  ? "Too many requests. Please try again later."
                  : "Safari tour service is unavailable.",
      }, [401, 403, 422, 429].includes(status)
        ? status
        : 503);
    }

    const payload: unknown = await response.json();

    if (!isRecord(payload) ||
        payload.success !== true ||
        !isRecord(payload.data)) {
      throw new Error("Unexpected tour API response.");
    }

    const data = payload.data;

    if (
      !Array.isArray(data.tours) ||
      data.tours.length > perPage ||
      !integerInRange(data.total, 0, 2147483647) ||
      !integerInRange(
        data.current_page, 1, 100000,
      ) ||
      !integerInRange(
        data.last_page, 1, 2147483647,
      ) ||
      !(
        data.company_status === null ||
        ["pending", "approved", "rejected", "suspended"]
          .includes(String(data.company_status))
      )
    ) {
      throw new Error("Invalid pagination response.");
    }

    const tours = [];

    for (const item of data.tours) {
      const tour = parseTour(item);

      if (!tour) {
        throw new Error("Invalid tour record.");
      }

      tours.push(tour);
    }

    return reply({
      success: true,
      data: {
        tours,
        total: data.total,
        current_page: data.current_page,
        last_page: data.last_page,
        company_status: data.company_status,
      },
    });
  } catch {
    return reply({
      success: false,
      message:
        "Unable to load your safari tours right now.",
    }, 503);
  }
}
