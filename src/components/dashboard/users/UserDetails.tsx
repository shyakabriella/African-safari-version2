import Link from "next/link";

import type {
  DirectoryUser,
} from "@/lib/admin/directory";

import type {
  AccountRole,
} from "@/lib/auth/roles";

import styles from "./UserDetails.module.css";

const roles: Record<AccountRole, string> = {
  admin: "Administrator",
  customer: "Customer",
  vendor: "Vendor",
  partner: "Partner",
  agent: "Agent",
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join("") || "U";
}

type Props = {
  user: DirectoryUser;
  currentAdminId: number;
};

export default function UserDetails({
  user,
  currentAdminId,
}: Props) {

  const ownAccount =
    user.id === currentAdminId;

  const information = [
    {
      label: "Full name",
      value: user.name,
    },
    {
      label: "Email address",
      value: user.email,
    },
    {
      label: "Phone number",
      value: user.phone || "Not provided",
    },
    {
      label: "Account ID",
      value: `#${user.id}`,
    },
    {
      label: "Account role",
      value: roles[user.role],
    },
    {
      label: "Account status",
      value: user.is_active
        ? "Active"
        : "Suspended",
    },
    {
      label: "Registration date",
      value: formatDate(user.created_at),
    },
    {
      label: "Last updated",
      value: formatDate(user.updated_at),
    },
  ];

  return (
    <main className={styles.container}>
      <nav
        className={styles.breadcrumb}
        aria-label="Breadcrumb"
      >
        <Link href="/dashboard">
          Dashboard
        </Link>

        <span aria-hidden="true">/</span>

        <Link href="/dashboard/users">
          Users
        </Link>

        <span aria-hidden="true">/</span>

        <span aria-current="page">
          Account #{user.id}
        </span>
      </nav>

      <header className={styles.heading}>
        <div>
          <h1>User Details</h1>

          <p>
            View account information and
            registration details.
          </p>
        </div>

        <Link
          className={styles.button}
          href="/dashboard/users"
        >
          Back to Users Directory
        </Link>
      </header>

      <section className={styles.profileCard}>
        <div className={styles.avatar}>
          {initials(user.name)}
        </div>

        <div className={styles.identity}>
          <h2>{user.name}</h2>

          <p>{user.email}</p>

          <p>Account #{user.id}</p>

          <div className={styles.tags}>
            <span className={styles.role}>
              {roles[user.role]}
            </span>

            <span className={
              user.is_active
                ? styles.active
                : styles.inactive
            }>
              <i aria-hidden="true" />

              {user.is_active
                ? "Active account"
                : "Suspended account"}
            </span>
          </div>
        </div>
      </section>

      {ownAccount && (
        <section className={styles.notice}>
          <div>
            <strong>Your own account</strong>

            <p>
              You are currently viewing your
              administrator account.
            </p>
          </div>

          <Link
            className={styles.button}
            href="/dashboard/profile"
          >
            Manage my profile
          </Link>
        </section>
      )}

      <section className={styles.card}>
        <header className={styles.cardHeading}>
          <h2>Account Information</h2>

          <p>
            Current information recorded
            for this user.
          </p>
        </header>

        <dl className={styles.information}>
          {information.map(item => (
            <div
              className={styles.field}
              key={item.label}
            >
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeading}>
          <h2>Account Administration</h2>

          <p>
            Administrative actions will
            be enabled in upcoming modules.
          </p>
        </header>

        <div className={styles.actions}>
          {[
            "Edit account information",
            "Manage account role",
            "Manage account status",
            "Account audit history",
          ].map(action => (
            <div
              className={styles.action}
              key={action}
            >
              <span>{action}</span>

              <small>Coming soon</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function UserDetailsNotice({
  title,
  message,
  retryId,
}: {
  title: string;
  message: string;
  retryId?: string;
}) {
  return (
    <main className={styles.container}>
      <section
        className={styles.errorCard}
        role="alert"
      >
        <h1>{title}</h1>

        <p>{message}</p>

        <div className={styles.noticeActions}>
          <Link
            className={styles.button}
            href="/dashboard/users"
          >
            Back to Users Directory
          </Link>

          {retryId && (
            <a
              className={styles.primary}
              href={`/dashboard/users/${retryId}`}
            >
              Try again
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
