import type { Metadata } from "next";

import PasswordRecoveryForm from
  "@/components/auth/PasswordRecoveryForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Recover your African Safaris account.",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default function ForgotPasswordPage() {
  return <PasswordRecoveryForm mode="forgot" />;
}
