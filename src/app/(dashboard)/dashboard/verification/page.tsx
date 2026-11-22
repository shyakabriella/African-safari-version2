import type { Metadata } from "next";

import OperatorVerification from
  "@/components/dashboard/verification/OperatorVerification";

export const metadata: Metadata = {
  title: "Safari Operator Verification | African Safaris",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerificationPage() {
  return <OperatorVerification />;
}
