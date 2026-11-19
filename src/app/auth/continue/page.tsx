import type { Metadata } from "next";

import { Suspense } from "react";
import { redirect } from "next/navigation";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  dashboardForRole,
} from "@/lib/auth/roles";

import {
  AccessNotice,
} from "@/components/auth/RoleWorkspace";

export const metadata: Metadata = {
  title: "Opening Your Account",
  robots: {
    index: false,
    follow: false,
  },
};

async function ContinueAuthentication() {
  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    redirect("/login");
  }

  if (access.status !== "authenticated") {
    return (
      <AccessNotice
        unavailable={
          access.status === "unavailable"
        }
      />
    );
  }

  redirect(dashboardForRole(access.user.role));
}

export default function Page() {
  return (
    <Suspense
      fallback={<p>Opening your account...</p>}
    >
      <ContinueAuthentication />
    </Suspense>
  );
}
