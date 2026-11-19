import type { Metadata } from "next";

import PasswordRecoveryForm from
  "@/components/auth/PasswordRecoveryForm";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return <PasswordRecoveryForm mode="reset" />;
}
