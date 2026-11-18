"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import DashboardSidebar, {
  type DashboardUser,
} from "./DashboardSidebar";

import DashboardNavbar from "./DashboardNavbar";
import DashboardFooter from "./DashboardFooter";
import DashboardMain from "./DashboardMain";

import styles from "./Dashboard.module.css";

export default function DashboardLayout({
  user,
  children,
}: {
  user: DashboardUser;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className={styles.shell}>
      {open && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
        />
      )}

      <DashboardSidebar
        user={user}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className={styles.workspace}>
        <DashboardNavbar
          user={user}
          open={open}
          onMenu={() => setOpen(value => !value)}
        />

        <DashboardMain>
          {children}
        </DashboardMain>

        <DashboardFooter />
      </div>
    </div>
  );
}
