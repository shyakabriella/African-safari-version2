import "server-only";

import { cookies } from "next/headers";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  parseDirectoryUser,
  type DirectoryUser,
} from "@/lib/admin/directory";

const API =
  "https://api.hotelandsafari.com/api/admin/users";

export type UserDetailsResult =
  | {
      ok: true;
      data: DirectoryUser;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

function failure(
  status: number,
  message: string
): UserDetailsResult {
  return {
    ok: false,
    status,
    message,
  };
}

export function parseUserId(
  value: string
): number | null {
  if (
    !/^[1-9][0-9]{0,15}$/.test(value)
  ) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id)
    && id > 0
    ? id
    : null;
}

export async function getUserDetails(
  rawId: string,
  hasQuery = false
): Promise<UserDetailsResult> {

  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    return failure(
      401,
      "Please sign in again."
    );
  }

  if (access.status === "unavailable") {
    return failure(
      503,
      "Account verification is temporarily unavailable."
    );
  }

  if (
    access.status !== "authenticated" ||
    access.user.role !== "admin"
  ) {
    return failure(
      403,
      "Administrator access required."
    );
  }

  const id = parseUserId(rawId);

  if (id === null) {
    return failure(
      422,
      "Invalid account ID."
    );
  }

  if (hasQuery) {
    return failure(
      422,
      "Unexpected query parameters."
    );
  }

  const store = await cookies();

  const token =
    store.get("afhbh_session")?.value;

  if (!token) {
    return failure(
      401,
      "Please sign in again."
    );
  }

  try {
    const response = await fetch(
      `${API}/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      }
    );

    switch (response.status) {
      case 401:
        return failure(
          401,
          "Please sign in again."
        );

      case 403:
        return failure(
          403,
          "Administrator access required."
        );

      case 404:
        return failure(
          404,
          "User account not found."
        );

      case 429:
        return failure(
          429,
          "Too many requests. Please try again later."
        );
    }

    if (!response.ok) {
      return failure(
        503,
        "User details are temporarily unavailable."
      );
    }

    const payload: unknown =
      await response.json().catch(() => null);

    if (
      payload === null ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return failure(
        502,
        "Unable to verify account information."
      );
    }

    const result =
      payload as Record<string, unknown>;

    if (result.success !== true) {
      return failure(
        502,
        "Unable to verify account information."
      );
    }

    const user =
      parseDirectoryUser(result.data);

    // A valid response must describe the
    // exact account requested by the admin.
    if (!user || user.id !== id) {
      return failure(
        502,
        "Unable to verify account information."
      );
    }

    return {
      ok: true,
      data: user,
    };

  } catch {
    return failure(
      503,
      "User details are temporarily unavailable."
    );
  }
}
