import type { Metadata } from "next";

import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SessionsForm from
  "@/components/auth/SessionsForm";

import {
  profileRequest,
  parseProfile,
} from "@/lib/auth/profile";

export const metadata: Metadata = {
  title: "Active Sessions",
  robots: {
    index: false,
    follow: false,
  },
};

async function ProtectedSessions() {
  const store = await cookies();
  const token = store.get("afhbh_session")?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await profileRequest(token);
  } catch {
    return <p>Account service temporarily unavailable.</p>;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return <p>Account access denied.</p>;
  }

  const profile = parseProfile(
    await response.json().catch(() => null)
  );

  if (
    !profile ||
    !profile.is_active ||
    profile.role !== "admin"
  ) {
    return <p>Administrator access required.</p>;
  }

  return <SessionsForm />;
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<p>Loading sessions...</p>}>
      <ProtectedSessions />
    </Suspense>
  );
}
