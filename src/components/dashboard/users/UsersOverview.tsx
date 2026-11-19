"use client";

import {
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  DashboardIcon,
} from "../DashboardSidebar";

import type {
  UserSummary,
} from "@/lib/admin/users";

import type {
  AccountRole,
} from "@/lib/auth/roles";

import styles from "./Users.module.css";

const roles: {
  role: AccountRole;
  label: string;
}[] = [
  {
    role: "admin",
    label: "Administrators",
  },
  {
    role: "customer",
    label: "Customers",
  },
  {
    role: "vendor",
    label: "Vendors",
  },
  {
    role: "partner",
    label: "Partners",
  },
  {
    role: "agent",
    label: "Agents",
  },
];

function formatCount(value: number) {
  return new Intl.NumberFormat("en-GB")
    .format(value);
}

export default function UsersOverview({
  initialSummary,
  initialError = "",
}: {
  initialSummary: UserSummary | null;
  initialError?: string;
}) {
  const router = useRouter();

  const [summary, setSummary] =
    useState(initialSummary);

  const [error, setError] =
    useState(initialError);

  const [loading, setLoading] =
    useState(false);

  const busy = useRef(false);

  async function refresh() {
    if (busy.current) return;

    busy.current = true;

    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const response = await fetch(
        "/api/admin/users/summary",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(35000),
        }
      );

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      if (response.status === 403) {
        window.location.replace("/auth/continue");
        return;
      }

      const result = await response.json()
        .catch(() => null);

      if (
        !response.ok ||
        result?.success !== true ||
        !result.data
      ) {
        setError(
          typeof result?.message === "string"
            ? result.message
            : "Unable to load user statistics."
        );

        return;
      }

      setSummary(result.data);
      router.refresh();

    } catch {
      setError(
        "Connection problem. Please try again."
      );
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }

  const metrics = [
    {
      title: "Total Users",
      value: summary?.total_users,
      icon: "users",
      detail: "All registered accounts",
    },
    {
      title: "Active Users",
      value: summary?.active_users,
      icon: "shield",
      detail: "Accounts with platform access",
    },
    {
      title: "Suspended Users",
      value: summary?.inactive_users,
      icon: "lock",
      detail: "Accounts with restricted access",
    },
    {
      title: "Administrators",
      value: summary?.by_role.admin.total,
      icon: "settings",
      detail: "Management accounts",
    },
  ];

  return (
    <div className={styles.page}>

      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            ADMINISTRATION
          </span>

          <h1>Users Management</h1>

          <p>
            Manage and monitor all platform accounts.
          </p>
        </div>

        <button
          type="button"
          className={styles.refresh}
          onClick={refresh}
          disabled={loading}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 11a8 8 0 1 0-2 6" />
            <path d="M20 4v7h-7" />
          </svg>

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div
          className={styles.error}
          role="alert"
        >
          {error}
        </div>
      )}

      {loading && (
        <p
          className={styles.loading}
          role="status"
        >
          Retrieving current account statistics...
        </p>
      )}

      <div
        className={styles.metrics}
        aria-busy={loading}
      >
        {metrics.map(metric => (
          <section
            key={metric.title}
            className={styles.metric}
          >
            <div className={styles.metricTop}>
              <span>{metric.title}</span>

              <div className={styles.metricIcon}>
                <DashboardIcon name={metric.icon} />
              </div>
            </div>

            <strong>
              {metric.value === undefined
                ? "—"
                : formatCount(metric.value)}
            </strong>

            <small>{metric.detail}</small>
          </section>
        ))}
      </div>

      <div className={styles.contentGrid}>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Account Distribution</h2>
            <p>
              Registered accounts by role and status.
            </p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Account role</th>
                  <th scope="col">Total</th>
                  <th scope="col">Active</th>
                  <th scope="col">Suspended</th>
                </tr>
              </thead>

              <tbody>
                {roles.map(({ role, label }) => {
                  const item =
                    summary?.by_role[role];

                  return (
                    <tr key={role}>
                      <td>{label}</td>

                      <td>
                        {item
                          ? formatCount(item.total)
                          : "—"}
                      </td>

                      <td className={styles.active}>
                        {item
                          ? formatCount(item.active)
                          : "—"}
                      </td>

                      <td>
                        {item
                          ? formatCount(item.inactive)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Role Overview</h2>
            <p>
              Distribution of registered platform users.
            </p>
          </div>

          <div className={styles.distribution}>
            {roles.map(({ role, label }) => {
              const count =
                summary?.by_role[role].total;

              const percentage =
                summary && summary.total_users > 0
                  ? Math.min(
                      100,
                      ((count ?? 0) /
                        summary.total_users) * 100
                    )
                  : 0;

              return (
                <div
                  key={role}
                  className={styles.distributionItem}
                >
                  <div>
                    <span>{label}</span>

                    <strong>
                      {count === undefined
                        ? "—"
                        : formatCount(count)}
                    </strong>
                  </div>

                  <div
                    className={styles.track}
                    aria-hidden="true"
                  >
                    <span
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <h2>Users Directory</h2>
          <p>
            Search, view and manage individual accounts.
          </p>
        </div>

        <div className={styles.directoryNotice}>
          <DashboardIcon name="users" />

          <strong>User directory integration pending</strong>

          <p>
            Search, filters, account details and staff
            management will be connected in the next stages.
          </p>
        </div>
      </section>

    </div>
  );
}
