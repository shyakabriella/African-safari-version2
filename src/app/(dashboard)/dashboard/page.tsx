import type { Metadata } from "next";

import { Suspense } from "react";
import { redirect } from "next/navigation";

import DashboardOverview from
  "@/components/dashboard/DashboardOverview";

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
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

async function ProtectedOverview() {
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

  return <DashboardOverview />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Loading overview...</p>}>
      <ProtectedOverview />
    </Suspense>
  );
}
