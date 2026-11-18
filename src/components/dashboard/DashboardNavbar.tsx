"use client";

import {
  DashboardIcon,
  initials,
  type DashboardUser,
} from "./DashboardSidebar";

import styles from "./Dashboard.module.css";

export default function DashboardNavbar({
  user,
  open,
  onMenu,
}: {
  user: DashboardUser;
  open: boolean;
  onMenu: () => void;
}) {
  return (
    <header className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <button
          type="button"
          className={styles.menuToggle}
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="dashboard-sidebar"
          onClick={onMenu}
        >
          <DashboardIcon name="menu" />
        </button>

        <div className={styles.search}>
          <DashboardIcon name="search" />
          <input
            type="search"
            placeholder="Search dashboard..."
            aria-label="Dashboard search"
            disabled
          />
        </div>
      </div>

      <div className={styles.navbarRight}>
        <button
          type="button"
          className={styles.notification}
          aria-label="Notifications not connected"
          disabled
        >
          <DashboardIcon name="bell" />
        </button>

        <div className={styles.profile}>
          <span className={styles.avatar}>
            {initials(user.name)}
          </span>

          <div className={styles.navbarUser}>
            <strong>{user.name}</strong>
            <small>Administrator</small>
          </div>
        </div>
      </div>
    </header>
  );
}
