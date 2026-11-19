"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Dashboard.module.css";

export type DashboardUser = {
  name: string;
  role: string;
};

export function initials(name: string) {
  return name.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join("") || "AD";
}

const iconPaths: Record<string, string> = {
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M22 21v-2a4 4 0 0 0-3-4",
  shield: "m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6z M8 12l3 3 5-6",
  compass: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M16 8l-2 6-6 2 2-6z",
  building: "M4 22V3h12v19 M16 9h5v13 M2 22h21 M8 7h4 M8 11h4 M8 15h4",
  file: "M5 2h9l5 5v15H5z M14 2v6h5 M8 13h8 M8 17h8",
  calendar: "M3 5h18v16H3z M7 2v6 M17 2v6 M3 10h18",
  wallet: "M3 5h18v15H3z M3 8h18 M15 12h6v5h-6z",
  chart: "M3 3v18h18 M7 16v-5 M12 16V5 M17 16V8",
  settings: "M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z",
  logout: "M10 3H3v18h7 M9 12h13 M17 7l5 5-5 5",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  bell: "M18 8a6 6 0 0 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9 M10 21h4",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6",
  close: "M5 5l14 14 M19 5 5 19",
};

export function DashboardIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[name] || iconPaths.dashboard} />
    </svg>
  );
}

const groups = [
  {
    title: "Workspace",
    items: [
      { name: "Dashboard", icon: "dashboard", href: "/dashboard" },
      { name: "My Profile", icon: "users", href: "/dashboard/profile" },
      { name: "Users", icon: "users", href: "/dashboard/users" },
      { name: "Tour Operators", icon: "users", href: "/dashboard/operators" },
      { name: "Verification", icon: "shield", href: "/dashboard/verification" },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { name: "Safari Tours", icon: "compass", href: "/dashboard/tours" },
      { name: "Properties", icon: "building", href: "/dashboard/properties" },
      { name: "Quotations", icon: "file", href: "/dashboard/quotations" },
      { name: "Bookings", icon: "calendar", href: "/dashboard/bookings" },
    ],
  },
  {
    title: "Finance & Management",
    items: [
      { name: "Payments", icon: "wallet", href: "/dashboard/payments" },
      { name: "Commissions", icon: "chart", href: "/dashboard/commissions" },
      { name: "Payouts", icon: "wallet", href: "/dashboard/payouts" },
      { name: "Reports", icon: "chart", href: "/dashboard/reports" },
      { name: "Settings", icon: "settings", href: "/dashboard/settings" },
    ],
  },
];

export default function DashboardSidebar({
  user,
  open,
  onClose,
}: {
  user: DashboardUser;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      id="dashboard-sidebar"
      className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
    >
      <div className={styles.brandRow}>
        <Link href="/dashboard" className={styles.brand}>
          <img src="/images/logo/ICON.PNG" alt="" />
          <span>
            <strong>African Safaris</strong>
            <small>Management Portal</small>
          </span>
        </Link>

        <button
          type="button"
          className={styles.closeMenu}
          onClick={onClose}
          aria-label="Close navigation"
        >
          <DashboardIcon name="close" />
        </button>
      </div>

      <nav className={styles.navigation} aria-label="Dashboard navigation">
        {groups.map(group => (
          <section key={group.title} className={styles.menuGroup}>
            <p className={styles.menuTitle}>{group.title}</p>

            {group.items.map(item => {
              const active = pathname === item.href;

              if (
                item.href !== "/dashboard" &&
                item.href !== "/dashboard/profile" &&
                item.href !== "/dashboard/users"
              ) {
                return (
                  <span
                    key={item.href}
                    className={styles.pendingLink}
                    aria-disabled="true"
                    title="Module not connected yet"
                  >
                    <DashboardIcon name={item.icon} />
                    {item.name}
                  </span>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`${styles.navLink} ${active ? styles.active : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <DashboardIcon name={item.icon} />
                  {item.name}
                </Link>
              );
            })}
          </section>
        ))}
      </nav>

      <div className={styles.sidebarBottom}>
        <div className={styles.profile}>
          <span className={styles.avatar}>
            {initials(user.name)}
          </span>

          <div>
            <strong>{user.name}</strong>
            <small>Administrator</small>
          </div>
        </div>

        <form action="/api/auth/logout" method="post">
          <button type="submit" className={styles.logout}>
            <DashboardIcon name="logout" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
