import { DashboardIcon } from "./DashboardSidebar";
import styles from "./Dashboard.module.css";

const metrics = [
  { label: "Total Users", color: "#6273c8" },
  { label: "Tour Operators", color: "#bd8645" },
  { label: "Safari Tours", color: "#278968" },
  { label: "Properties", color: "#9367c0" },
  { label: "Quotations", color: "#3498b1" },
  { label: "Bookings", color: "#c86c78" },
];

const actions = [
  { name: "Manage Users", icon: "users" },
  { name: "Review Operators", icon: "shield" },
  { name: "Manage Safari Tours", icon: "compass" },
  { name: "View Quotations", icon: "file" },
];

export default function DashboardOverview() {
  return (
    <div className={styles.overview}>
      <div className={styles.pageHeading}>
        <div>
          <span className={styles.eyebrow}>
            Management &amp; Analytics
          </span>

          <h1>Dashboard</h1>

          <p>
            Manage your safari marketplace and hotel
            booking operations.
          </p>
        </div>

        <span className={styles.portalLabel}>
          Administration Portal
        </span>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <h2>Platform Summary</h2>
          <p>Overview of your marketplace activity.</p>
        </div>

        <div className={styles.metrics}>
          {metrics.map(metric => (
            <div className={styles.metric} key={metric.label}>
              <span className={styles.metricLabel}>
                <i
                  aria-hidden="true"
                  style={{ backgroundColor: metric.color }}
                />
                {metric.label}
              </span>

              <strong>—</strong>
              <small>Data not connected</small>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Safari Quotation Requests</h2>
            <p>Monitor traveler requests and responses.</p>
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
                    <div className={styles.emptyState}>
                      <DashboardIcon name="file" />
                      <strong>Quotation data not connected</strong>
                      <p>Traveler requests will appear here.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Quick Actions</h2>
            <p>Manage platform operations.</p>
          </div>

          <div className={styles.quickActions}>
            {actions.map(action => (
              <button
                key={action.name}
                type="button"
                disabled
                title="Module not connected yet"
              >
                <DashboardIcon name={action.icon} />
                <span>{action.name}</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Operator Activity</h2>
            <p>Registered and approved safari operators.</p>
          </div>
          <div className={styles.emptyState}>
            <DashboardIcon name="users" />
            <strong>Awaiting live data</strong>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <h2>Booking Activity</h2>
            <p>Safari and accommodation reservations.</p>
          </div>
          <div className={styles.emptyState}>
            <DashboardIcon name="calendar" />
            <strong>Awaiting live data</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
