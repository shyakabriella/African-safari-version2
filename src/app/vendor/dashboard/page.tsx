import type { Metadata } from "next";
import { Suspense } from "react";

import VendorDashboard from
  "@/components/vendor/VendorDashboard";

export const metadata: Metadata = {
  title: "Tour Operator Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<p>Verifying account...</p>}>
      <VendorDashboard />
    </Suspense>
  );
}
