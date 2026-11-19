import type { Metadata } from "next";

import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import ChangePasswordForm from
  "@/components/auth/ChangePasswordForm";

import {
  profileRequest,
  parseProfile,
} from "@/lib/auth/profile";

export const metadata: Metadata = {
  title: "Change Password",
  robots: {
    index: false,
    follow: false,
  },
};

async function ProtectedChangePassword() {
  const store = await cookies();

  const token =
    store.get("afhbh_session")?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await profileRequest(token);
  } catch {
    return (
      <p>Account service temporarily unavailable.</p>
    );
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return <p>Account access denied.</p>;
  }

  const payload = await response.json()
    .catch(() => null);

  const user = parseProfile(payload);

  if (
    !user ||
    !user.is_active ||
    user.role !== "admin"
  ) {
    return <p>Administrator access required.</p>;
  }

  return <ChangePasswordForm />;
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ProtectedChangePassword />
    </Suspense>
  );
}
