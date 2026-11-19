import "server-only";

import { redirect } from "next/navigation";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  ADMIN_ACCOUNT_ROUTES,
  SHARED_ACCOUNT_ROUTES,
} from "@/lib/auth/account-routes";

import {
  AccessNotice,
} from "@/components/auth/RoleWorkspace";

import ProfileForm from "./ProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import SessionsForm from "./SessionsForm";

type Section =
  | "profile"
  | "changePassword"
  | "sessions";

export default async function SharedAccountPage({
  section,
}: {
  section: Section;
}) {
  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    redirect("/login");
  }

  if (access.status !== "authenticated") {
    return (
      <AccessNotice
        unavailable={
          access.status === "unavailable"
        }
      />
    );
  }

  const user = access.user;

  if (user.role === "admin") {
    redirect(ADMIN_ACCOUNT_ROUTES[section]);
  }

  if (section === "profile") {
    return (
      <ProfileForm initialProfile={user} />
    );
  }

  if (section === "changePassword") {
    return (
      <ChangePasswordForm
        profileHref={SHARED_ACCOUNT_ROUTES.profile}
      />
    );
  }

  return (
    <SessionsForm
      profileHref={SHARED_ACCOUNT_ROUTES.profile}
    />
  );
}
