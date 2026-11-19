import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  ROLE_CONFIG,
  dashboardForRole,
} from "@/lib/auth/roles";

import {
  AccessNotice,
} from "@/components/auth/RoleWorkspace";

import {
  SHARED_ACCOUNT_ROUTES,
} from "@/lib/auth/account-routes";

import styles from
  "@/components/auth/RoleWorkspace.module.css";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

async function ProtectedAccountLayout({
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
  const config = ROLE_CONFIG[user.role];

  if (user.role === "admin") {
    redirect("/dashboard/profile");
  }

  return (
    <div className={styles.shell}>

      <header className={styles.header}>

        <Link
          href={dashboardForRole(user.role)}
          className={styles.brand}
        >
          <img
            src="/images/logo/ICON.PNG"
            alt=""
            width="42"
            height="42"
          />

          <span>
            <strong>African Safaris</strong>
            <small>My Account</small>
          </span>
        </Link>

        <div className={styles.userArea}>

          <div className={styles.identity}>
            <strong>{user.name}</strong>
            <small>{config.label}</small>
          </div>

          <form
            action="/api/auth/logout"
            method="post"
          >
            <button
              type="submit"
              className={styles.logout}
            >
              Sign Out
            </button>
          </form>

        </div>

      </header>

      <nav
        className={styles.accountNavigation}
        aria-label="Account navigation"
      >

        <Link href={dashboardForRole(user.role)}>
          Dashboard
        </Link>

        <Link href={SHARED_ACCOUNT_ROUTES.profile}>
          My Profile
        </Link>

        <Link href={SHARED_ACCOUNT_ROUTES.changePassword}>
          Change Password
        </Link>

        <Link href={SHARED_ACCOUNT_ROUTES.sessions}>
          Active Sessions
        </Link>

      </nav>

      <main className={styles.content}>
        {children}
      </main>

      <footer className={styles.footer}>
        African Safaris &amp; Hotel Booking Hub
      </footer>

    </div>
  );
}

export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<p>Verifying account...</p>}>
      <ProtectedAccountLayout>
        {children}
      </ProtectedAccountLayout>
    </Suspense>
  );
}
