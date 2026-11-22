import type { ReactNode } from "react";

import { Suspense } from "react";

// Authentication must be verified for each request.
// Protected dashboard navigation may wait for verification.
export const instant = false;
import { redirect } from "next/navigation";

import DashboardLayout from
  "@/components/dashboard/DashboardLayout";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  dashboardForRole,
} from "@/lib/auth/roles";

import {
  AccessNotice,
} from "@/components/auth/RoleWorkspace";

async function ProtectedDashboard({
  children,
}: {
  children: ReactNode;
}) {
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

  const user = access.user;

  if (user.role !== "admin") {
    redirect(dashboardForRole(user.role));
  }

  return (
    <DashboardLayout
      user={{
        name: user.name,
        role: user.role,
      }}
    >
      {children}
    </DashboardLayout>
  );
}

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={<p>Loading dashboard...</p>}
    >
      <ProtectedDashboard>
        {children}
      </ProtectedDashboard>
    </Suspense>
  );
}
