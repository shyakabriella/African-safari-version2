import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { getAccountAccess } from "@/lib/auth/access";
import { reply } from "@/lib/auth/server";

const API =
  "https://api.hotelandsafari.com/api/admin/safari-operators";

function record(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function safeCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
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
    access.user.role !== "admin"
  ) {
    return reply({
      success: false,
      message: "Administrator access required.",
    }, 403);
  }

  const params = request.nextUrl.searchParams;

  for (const key of params.keys()) {
    if (
      !["search", "page"].includes(key) ||
      params.getAll(key).length !== 1
    ) {
      return reply({
        success: false,
        message: "Invalid search parameters.",
      }, 422);
    }
  }

  const search = (params.get("search") ?? "").trim();
  const page = params.get("page") ?? "1";

  if (
    search.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(search) ||
    !/^[1-9]\d{0,5}$/.test(page) ||
    Number(page) > 100000
  ) {
    return reply({
      success: false,
      message: "Invalid operator search.",
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

  const url = new URL(API);

  url.searchParams.set("search", search);
  url.searchParams.set("page", page);
  url.searchParams.set("per_page", "20");

  try {
    const response = await fetch(url.toString(), {
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
              ? "Operator directory access denied."
              : status === 429
                ? "Too many requests. Try again shortly."
                : "Operator directory is unavailable.",
      }, [401, 403, 429].includes(status) ? status : 503);
    }

    const payload: unknown = await response.json();

    if (
      !record(payload) ||
      payload.success !== true ||
      !record(payload.data)
    ) {
      throw new Error("Unexpected operator directory.");
    }

    const data = payload.data;

    if (
      !Array.isArray(data.data) ||
      !safeCount(data.total) ||
      !safeCount(data.current_page) ||
      !safeCount(data.last_page) ||
      data.current_page < 1 ||
      data.last_page < 1 ||
      data.data.length > 20
    ) {
      throw new Error("Invalid operator directory page.");
    }

    const operators: {
      id: number;
      display_name: string;
    }[] = [];

    for (const item of data.data) {
      if (
        !record(item) ||
        !safeCount(item.id) ||
        item.id < 1 ||
        typeof item.display_name !== "string" ||
        !item.display_name.trim() ||
        item.display_name.length > 255 ||
        item.type !== "safari_operator" ||
        item.status !== "approved"
      ) {
        throw new Error("Invalid operator information.");
      }

      operators.push({
        id: item.id,
        display_name: item.display_name,
      });
    }

    return reply({
      success: true,
      data: {
        operators,
        total: data.total,
        current_page: data.current_page,
        last_page: data.last_page,
      },
    });
  } catch {
    return reply({
      success: false,
      message: "Unable to load approved safari operators.",
    }, 503);
  }
}
