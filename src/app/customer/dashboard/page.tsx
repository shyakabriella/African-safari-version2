import type { Metadata } from "next";
import { Suspense } from "react";

import RoleWorkspace from
  "@/components/auth/RoleWorkspace";

export const metadata: Metadata = {
  title: "Traveler Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<p>Verifying account...</p>}>
      <RoleWorkspace role="customer" />
    </Suspense>
  );
}
