import type { Metadata } from "next";

import DashboardOverview from
  "@/components/dashboard/DashboardOverview";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
