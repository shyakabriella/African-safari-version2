import Link from "next/link";

import { DashboardIcon } from "./DashboardSidebar";
import styles from "./Dashboard.module.css";

import {
  getUserSummary,
} from "@/lib/admin/users";

type DashboardMetric = {
  label: string;
  value: number | null;
  color: string;
  description: string;
};

const pendingActions = [
  {
    name: "Manage Safari Tours",
    icon: "compass",
  },
  {
    name: "View Quotations",
    icon: "file",
  },
  {
    name: "Manage Reservations",
    icon: "calendar",
  },
];

function MetricCard({
  metric,
}: {
  metric: DashboardMetric;
}) {
  const connected = metric.value !== null;

  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>
        <i
          aria-hidden="true"
          style={{
            backgroundColor: metric.color,
          }}
        />
        {metric.label}
      </span>

      <strong>
        {connected
          ? metric.value!.toLocaleString("en-US")
          : "—"}
      </strong>

      <small>{metric.description}</small>
    </div>
  );
}

function DashboardEmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.emptyState}>
      <DashboardIcon name={icon} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export default async function DashboardOverview() {
  const result = await getUserSummary();

  const summary = result.ok ? result.data : null;

  const metrics: DashboardMetric[] = [
    {
      label: "Total Users",
      value: summary?.total_users ?? null,
      color: "#6273c8",
      description: summary
        ? "Registered platform accounts"
        : "Live statistics unavailable",
    },
    {
      label: "Active Users",
      value: summary?.active_users ?? null,
      color: "#278968",
      description: summary
        ? "Currently active accounts"
        : "Live statistics unavailable",
    },
    {
      label: "Inactive Users",
      value: summary?.inactive_users ?? null,
      color: "#bd8645",
      description: summary
        ? "Inactive platform accounts"
        : "Live statistics unavailable",
    },
    {
      label: "Safari Tours",
      value: null,
      color: "#3498b1",
      description: "Reporting API not connected",
    },
    {
      label: "Quotations",
      value: null,
      color: "#9367c0",
      description: "Reporting API not connected",
    },
    {
      label: "Reservations",
      value: null,
      color: "#c86c78",
      description: "Reporting API not connected",
    },
  ];

  return (
    <div className={styles.overview}>
      <div className={styles.pageHeading}>
        <div>
          <span className={styles.eyebrow}>
            Management &amp; Analytics
          </span>

          <h1>Dashboard</h1>

          <p>
            Manage your safari marketplace, travelers,
            operators and accommodation operations.
          </p>
        </div>

        <span className={styles.portalLabel}>
          Administration Portal
        </span>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <h2>Platform Summary</h2>
          <p>
            Verified account statistics and marketplace
            reporting status.
          </p>
        </div>

        <div className={styles.metrics}>
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              metric={metric}
            />
          ))}
        </div>

        {!summary && (
          <p
            role="status"
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "var(--muted, #697586)",
            }}
          >
            Account statistics are temporarily
            unavailable. No estimated figures are shown.
          </p>
        )}
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Safari Quotation Requests</h2>
            <p>
              Monitor traveler requests and operator
              quotations.
            </p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Destination</th>
                  <th>Travel Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td colSpan={4}>
                    <DashboardEmptyState
                      icon="file"
                      title="Quotation reporting not connected"
                      description="Traveler quotation statistics will appear when the admin reporting API is available."
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Quick Actions</h2>
            <p>
              Access available management tools.
            </p>
          </div>

          <div className={styles.quickActions}>
            <Link
              href="/dashboard/users"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                border: "1px solid #dce5e3",
                borderRadius: "10px",
                backgroundColor: "#f5faf8",
                color: "#17664f",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              <DashboardIcon name="users" />
              <span style={{ flex: 1 }}>
                Manage Users
              </span>
              <span aria-hidden="true">→</span>
            </Link>

            {pendingActions.map((action) => (
              <button
                key={action.name}
                type="button"
                disabled
                title="Dashboard module not connected yet"
              >
                <DashboardIcon name={action.icon} />
                <span>{action.name}</span>
                <span aria-hidden="true">—</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Operator Activity</h2>
            <p>
              Registered and approved safari operators.
            </p>
          </div>

          <DashboardEmptyState
            icon="users"
            title="Operator reporting pending"
            description="The operator dashboard will connect to verified vendor and tour data."
          />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Reservation Activity</h2>
            <p>
              Temporary safari reservations and
              upcoming departures.
            </p>
          </div>

          <DashboardEmptyState
            icon="calendar"
            title="Reservation reporting pending"
            description="Customer reservations are available through protected APIs. Admin reporting will be connected separately."
          />
        </section>
      </div>
    </div>
  );
}
