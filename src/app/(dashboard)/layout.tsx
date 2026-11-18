import type { ReactNode } from "react";

import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

async function ProtectedDashboard({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("afhbh_session")?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(
      "https://api.hotelandsafari.com/api/me",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch {
    return (
      <main style={{ padding: 30 }}>
        <h1>Authentication service unavailable</h1>
        <p>Please try again later.</p>
      </main>
    );
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return (
      <main style={{ padding: 30 }}>
        <h1>Unable to verify your access</h1>
        <Link href="/login">Return to sign in</Link>
      </main>
    );
  }

  const payload = await response.json().catch(() => null);

  const user =
    payload?.data?.user ??
    payload?.user ??
    payload?.data ??
    payload;

  if (
    !user ||
    typeof user.name !== "string" ||
    user.role !== "admin" ||
    user.is_active === false ||
    user.is_active === 0
  ) {
    return (
      <main style={{ padding: 30 }}>
        <h1>Administrator access required</h1>

        <p>
          Your account does not have access to this portal.
        </p>

        <form action="/api/auth/logout" method="post">
          <button type="submit">Sign out</button>
        </form>
      </main>
    );
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
    <Suspense fallback={<p style={{ padding: 30 }}>Loading dashboard...</p>}>
      <ProtectedDashboard>
        {children}
      </ProtectedDashboard>
    </Suspense>
  );
}
