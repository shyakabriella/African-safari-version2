import type { Metadata } from "next";

import { Suspense } from "react";

import {
  redirect,
} from "next/navigation";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  dashboardForRole,
} from "@/lib/auth/roles";

import {
  getUserDetails,
  parseUserId,
} from "@/lib/admin/user-details";

import UserDetails, {
  UserDetailsNotice,
} from "@/components/dashboard/users/UserDetails";

export const metadata: Metadata = {
  title: "User Details",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function ProtectedUserDetails({
  params,
}: Props) {

  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    redirect("/login");
  }

  if (access.status !== "authenticated") {
    return (
      <UserDetailsNotice
        title="Account verification unavailable"
        message="Unable to verify administrator access."
      />
    );
  }

  if (access.user.role !== "admin") {
    redirect(
      dashboardForRole(access.user.role)
    );
  }

  const { id } = await params;

  if (parseUserId(id) === null) {
    return (
      <UserDetailsNotice
        title="Invalid account ID"
        message="Please select a valid user from the directory."
      />
    );
  }

  const result = await getUserDetails(id);

  if (!result.ok) {
    if (result.status === 401) {
      redirect("/login");
    }

    if (result.status === 403) {
      return (
        <UserDetailsNotice
          title="Access denied"
          message="Administrator access required."
        />
      );
    }

    if (result.status === 404) {
      return (
        <UserDetailsNotice
          title="User account not found"
          message="The requested account could not be found."
        />
      );
    }

    return (
      <UserDetailsNotice
        title="Unable to load user details"
        message={result.message}
        retryId={
          result.status === 422
            ? undefined
            : id
        }
      />
    );
  }

  return (
    <UserDetails
      user={result.data}
      currentAdminId={access.user.id}
    />
  );
}

export default function UserDetailsPage(
  props: Props
) {
  return (
    <Suspense
      fallback={
        <p role="status">
          Loading user details...
        </p>
      }
    >
      <ProtectedUserDetails {...props} />
    </Suspense>
  );
}
