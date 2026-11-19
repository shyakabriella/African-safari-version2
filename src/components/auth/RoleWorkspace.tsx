import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  ROLE_CONFIG,
  dashboardForRole,
  type AccountRole,
} from "@/lib/auth/roles";

import styles from "./RoleWorkspace.module.css";

export function AccessNotice({
  unavailable = false,
}: {
  unavailable?: boolean;
}) {
  return (
    <main className={styles.noticePage}>
      <section className={styles.noticeCard}>

        <span className={styles.eyebrow}>
          ACCOUNT ACCESS
        </span>

        <h1>
          {unavailable
            ? "Account service unavailable"
            : "Account access denied"}
        </h1>

        <p>
          {unavailable
            ? "We could not verify your account. Please try again later."
            : "Your account is not authorized to access this workspace."}
        </p>

        <div className={styles.actions}>

          {unavailable && (
            <Link
              href="/auth/continue"
              className={styles.primary}
            >
              Try Again
            </Link>
          )}

          <Link
            href="/login"
            className={styles.secondary}
          >
            Return to Sign In
          </Link>

        </div>

      </section>
    </main>
  );
}

export default async function RoleWorkspace({
  role,
}: {
  role: Exclude<AccountRole, "admin">;
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

  // Independently validate the requested workspace.
  // A URL or a client-supplied role is never trusted.
  if (user.role !== role) {
    redirect(dashboardForRole(user.role));
  }

  const config = ROLE_CONFIG[role];

  return (
    <main className={styles.shell}>

      <header className={styles.header}>

        <Link href="/" className={styles.brand}>
          <img
            src="/images/logo/ICON.PNG"
            alt=""
            width="42"
            height="42"
          />

          <span>
            <strong>African Safaris</strong>
            <small>Hotel Booking Hub</small>
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

      <div className={styles.content}>

        <div className={styles.welcome}>

          <span className={styles.eyebrow}>
            {config.label.toUpperCase()} WORKSPACE
          </span>

          <h1>{config.title}</h1>

          <p>Welcome, {user.name}.</p>

          <p>{config.description}</p>

        </div>

        <div className={styles.grid}>

          <section className={styles.card}>
            <h2>Account Overview</h2>

            <dl className={styles.details}>
              <div>
                <dt>Full name</dt>
                <dd>{user.name}</dd>
              </div>

              <div>
                <dt>Email address</dt>
                <dd>{user.email}</dd>
              </div>

              <div>
                <dt>Account type</dt>
                <dd>{config.label}</dd>
              </div>

              <div>
                <dt>Account status</dt>
                <dd className={styles.active}>
                  Active
                </dd>
              </div>
            </dl>
          </section>

          <section className={styles.card}>
            <h2>Account Security</h2>

            <p>
              Your account is authenticated and
              your workspace access is verified.
            </p>

            <p>
              Manage your personal information,
              password and signed-in sessions.
            </p>

            <div className={styles.accountLinks}>
              <Link
                href="/account/profile"
                className={styles.primary}
              >
                My Profile
              </Link>

              <Link
                href="/account/change-password"
                className={styles.secondary}
              >
                Change Password
              </Link>

              <Link
                href="/account/sessions"
                className={styles.secondary}
              >
                Active Sessions
              </Link>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Your Workspace</h2>

            <p>
              Additional marketplace features will
              be enabled as their modules are completed.
            </p>

            <Link
              href="/"
              className={styles.primary}
            >
              Explore African Safaris
            </Link>
          </section>

        </div>

      </div>

      <footer className={styles.footer}>
        African Safaris &amp; Hotel Booking Hub
      </footer>

    </main>
  );
}
