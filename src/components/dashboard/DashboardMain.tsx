import type { ReactNode } from "react";
import styles from "./Dashboard.module.css";

export default function DashboardMain({
  children,
}: {
  children: ReactNode;
}) {
  return <main className={styles.main}>{children}</main>;
}
