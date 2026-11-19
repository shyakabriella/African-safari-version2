import type { Metadata } from "next";
import { Suspense } from "react";

import SharedAccountPage from
  "@/components/auth/SharedAccountPage";

export const metadata: Metadata = {
  title: "Change Password",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<p>Loading account...</p>}>
      <SharedAccountPage section="changePassword" />
    </Suspense>
  );
}
