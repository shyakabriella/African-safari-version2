import "server-only";

const BASE = "https://api.hotelandsafari.com/api";

export type CatalogTour = {
  id: number;
  name: string;
  slug: string | null;
  status: string | null;
  durationDays: number | null;
  currency: string | null;
  basePrice: string | null;
};

export type CatalogPage = {
  tours: CatalogTour[];
  total: number;
  currentPage: number;
  lastPage: number;
};

export type CatalogResult =
  | { ok: true; data: CatalogPage }
  | { ok: false; message: string };

export type CatalogCountResult =
  | { ok: true; total: number }
  | { ok: false };

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function optionalString(
  value: unknown,
  maxLength = 255,
): string | null {
  return (
    typeof value === "string" &&
    value.length <= maxLength
  )
    ? value
    : null;
}

function parseTour(value: unknown): CatalogTour | null {
  if (
    !isRecord(value) ||
    !isCount(value.id) ||
    value.id === 0 ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 255
  ) {
    return null;
  }

  const duration = value.duration_days;

  const rawPrice = value.base_price;

  const basePrice =
    (
      typeof rawPrice === "string" &&
      /^\d{1,12}(\.\d{1,2})?$/.test(rawPrice)
    )
      ? rawPrice
      : (
          typeof rawPrice === "number" &&
          Number.isFinite(rawPrice) &&
          rawPrice >= 0
        )
          ? String(rawPrice)
          : null;

  return {
    id: value.id,
    name: value.name,
    slug: optionalString(value.slug),
    status: optionalString(value.status, 40),
    durationDays: isCount(duration) ? duration : null,
    currency: (
      typeof value.currency === "string" &&
      /^[A-Z]{3}$/.test(value.currency)
    ) ? value.currency : null,
    basePrice,
  };
}

async function fetchCatalog(
  endpoint: "tours" | "tour-schedules",
  page = 1,
): Promise<unknown> {
  const url = new URL(`${BASE}/${endpoint}`);

  url.searchParams.set("page", String(page));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error("Catalog API unavailable.");
  }

  return response.json();
}

function parsePage(
  payload: unknown,
): Record<string, unknown> | null {
  if (
    !isRecord(payload) ||
    payload.success !== true ||
    !isRecord(payload.data)
  ) {
    return null;
  }

  const page = payload.data;

  if (
    !isCount(page.total) ||
    !isCount(page.current_page) ||
    page.current_page < 1 ||
    !isCount(page.last_page) ||
    page.last_page < 1 ||
    !Array.isArray(page.data)
  ) {
    return null;
  }

  return page;
}

export async function getSafariCatalog(
  requestedPage = 1,
): Promise<CatalogResult> {
  const pageNumber = (
    Number.isSafeInteger(requestedPage) &&
    requestedPage >= 1 &&
    requestedPage <= 100000
  ) ? requestedPage : 1;

  try {
    const payload = await fetchCatalog(
      "tours",
      pageNumber,
    );

    const page = parsePage(payload);

    if (!page) {
      return {
        ok: false,
        message: "Unexpected safari catalog response.",
      };
    }

    const records = page.data as unknown[];

    const tours: CatalogTour[] = [];

    for (const record of records) {
      const tour = parseTour(record);

      if (!tour) {
        return {
          ok: false,
          message: "Safari catalog record format unavailable.",
        };
      }

      tours.push(tour);
    }

    return {
      ok: true,
      data: {
        tours,
        total: page.total as number,
        currentPage: page.current_page as number,
        lastPage: page.last_page as number,
      },
    };
  } catch {
    return {
      ok: false,
      message: "Safari catalog is temporarily unavailable.",
    };
  }
}

export async function getPublicDepartureCount():
  Promise<CatalogCountResult> {
  try {
    const payload = await fetchCatalog(
      "tour-schedules",
    );

    const page = parsePage(payload);

    if (!page) {
      return { ok: false };
    }

    return {
      ok: true,
      total: page.total as number,
    };
  } catch {
    return { ok: false };
  }
}

// ===== AFHBH F3-04E: ADMIN-SCOPED CATALOG =====

import { cookies } from "next/headers";

import {
  getAccountAccess,
} from "@/lib/auth/access";

async function adminCatalogToken():
  Promise<string | null> {
  const access = await getAccountAccess();

  if (
    access.status !== "authenticated" ||
    access.user.role !== "admin"
  ) {
    return null;
  }

  const store = await cookies();

  return store.get("afhbh_session")?.value ?? null;
}

async function fetchAdminCatalog(
  endpoint: "tours" | "tour-schedules",
  token: string,
  page = 1,
): Promise<unknown> {
  const path =
    endpoint === "tours"
      ? "admin/tours"
      : "tour-schedules";

  const url = new URL(`${BASE}/${path}`);

  url.searchParams.set("page", String(page));

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
    throw new Error(
      "Administrator catalog request failed.",
    );
  }

  return response.json();
}

export async function getAdminSafariCatalog(
  requestedPage = 1,
): Promise<CatalogResult> {
  const token = await adminCatalogToken();

  if (!token) {
    return {
      ok: false,
      message: "Administrator authorization required.",
    };
  }

  const pageNumber = (
    Number.isSafeInteger(requestedPage) &&
    requestedPage >= 1 &&
    requestedPage <= 100000
  ) ? requestedPage : 1;

  try {
    const payload = await fetchAdminCatalog(
      "tours",
      token,
      pageNumber,
    );

    const page = parsePage(payload);

    if (!page) {
      return {
        ok: false,
        message: "Unexpected administrator tour response.",
      };
    }

    const tours: CatalogTour[] = [];

    for (const record of page.data as unknown[]) {
      const tour = parseTour(record);

      if (!tour) {
        return {
          ok: false,
          message: "Unexpected tour record format.",
        };
      }

      tours.push(tour);
    }

    return {
      ok: true,
      data: {
        tours,
        total: page.total as number,
        currentPage: page.current_page as number,
        lastPage: page.last_page as number,
      },
    };
  } catch {
    return {
      ok: false,
      message:
        "Administrator safari catalog is temporarily unavailable.",
    };
  }
}

export async function getAdminDepartureCount():
  Promise<CatalogCountResult> {
  const token = await adminCatalogToken();

  if (!token) {
    return { ok: false };
  }

  try {
    const payload = await fetchAdminCatalog(
      "tour-schedules",
      token,
    );

    const page = parsePage(payload);

    if (!page) {
      return { ok: false };
    }

    return {
      ok: true,
      total: page.total as number,
    };
  } catch {
    return { ok: false };
  }
}

// ===== END AFHBH F3-04E =====
