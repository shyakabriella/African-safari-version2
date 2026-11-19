import type { Metadata } from "next";

import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import ProfileForm from "@/components/auth/ProfileForm";

import {
  profileRequest,
  parseProfile,
} from "@/lib/auth/profile";

export const metadata: Metadata = {
  title: "My Profile",
  robots: {
    index: false,
    follow: false,
  },
};

async function ProtectedProfile() {
  const store = await cookies();
  const token = store.get("afhbh_session")?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await profileRequest(token);
  } catch {
    return <p>Profile service temporarily unavailable.</p>;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return <p>Unable to verify your account.</p>;
  }

  const payload = await response.json()
    .catch(() => null);

  const profile = parseProfile(payload);

  if (
    !profile ||
    !profile.is_active ||
    profile.role !== "admin"
  ) {
    return <p>Administrator access required.</p>;
  }

  return <ProfileForm initialProfile={profile} />;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p>Loading profile...</p>}>
      <ProtectedProfile />
    </Suspense>
  );
}
