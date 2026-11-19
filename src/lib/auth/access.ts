import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import {
  profileRequest,
  parseProfile,
  type UserProfile,
} from "@/lib/auth/profile";

import {
  isAccountRole,
  type AccountRole,
} from "@/lib/auth/roles";

export type VerifiedAccount =
  Omit<UserProfile, "role"> & {
    role: AccountRole;
  };

export type AccountAccess =
  | {
      status: "authenticated";
      user: VerifiedAccount;
    }
  | {
      status:
        | "unauthenticated"
        | "forbidden"
        | "unavailable";
    };

// React cache deduplicates profile verification
// within the current server-rendering request.
// It does not persist account data across requests.
export const getAccountAccess = cache(
  async (): Promise<AccountAccess> => {
    const store = await cookies();
    const token = store.get("afhbh_session")?.value;

    if (!token) {
      return { status: "unauthenticated" };
    }

    try {
      const response = await profileRequest(token);

      if (response.status === 401) {
        return { status: "unauthenticated" };
      }

      if (response.status === 403) {
        return { status: "forbidden" };
      }

      if (!response.ok) {
        return { status: "unavailable" };
      }

      const payload = await response.json()
        .catch(() => null);

      const profile = parseProfile(payload);

      if (!profile) {
        return { status: "unavailable" };
      }

      if (
        !profile.is_active ||
        !isAccountRole(profile.role)
      ) {
        return { status: "forbidden" };
      }

      return {
        status: "authenticated",
        user: {
          ...profile,
          role: profile.role,
        },
      };

    } catch {
      return { status: "unavailable" };
    }
  }
);
