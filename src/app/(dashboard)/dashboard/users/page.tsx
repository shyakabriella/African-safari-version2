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
  getUserSummary,
} from "@/lib/admin/users";

import {
  AccessNotice,
} from "@/components/auth/RoleWorkspace";

import UsersOverview from
  "@/components/dashboard/users/UsersOverview";

export const metadata: Metadata = {
  title: "Users Management",
  robots: {
    index: false,
    follow: false,
  },
};

async function ProtectedUsers() {
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

  if (access.user.role !== "admin") {
    redirect(
      dashboardForRole(access.user.role)
    );
  }

  const summary = await getUserSummary();

  if (!summary.ok) {
    if (summary.status === 401) {
      redirect("/login");
    }

    if (summary.status === 403) {
      return <AccessNotice />;
    }

    // Show unavailable values rather than
    // incorrect zero statistics.
    return (
      <UsersOverview
        initialSummary={null}
        initialError={summary.message}
      />
    );
  }

  return (
    <UsersOverview
      initialSummary={summary.data}
    />
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={<p>Loading users management...</p>}
    >
      <ProtectedUsers />
    </Suspense>
  );
}
