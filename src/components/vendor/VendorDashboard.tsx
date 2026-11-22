import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getAccountAccess,
} from "@/lib/auth/access";

import {
  dashboardForRole,
} from "@/lib/auth/roles";

import {
  AccessNotice,
} from "@/components/auth/RoleWorkspace";

import SafariCompanyPanel from "./SafariCompanyPanel";

import VendorToursPanel from "./VendorToursPanel";

export default async function VendorDashboard() {
  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    redirect("/login");
  }

  if (access.status !== "authenticated") {
    return (
      <AccessNotice
        unavailable={access.status === "unavailable"}
      />
    );
  }

  if (access.user.role !== "vendor") {
    redirect(dashboardForRole(access.user.role));
  }

  const user = access.user;

  return (
    <main className="min-h-screen bg-[#f5f8f5] text-[#173c36]">
      <header className="border-b border-[#dfe9e2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="text-xl font-extrabold"
          >
            African Safaris
          </Link>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">
              {user.name}
            </span>

            <Link
              href="/account/profile"
              className="text-sm font-semibold text-[#186e52]"
            >
              My Profile
            </Link>

            <form
              action="/api/auth/logout"
              method="post"
            >
              <button
                type="submit"
                className="rounded-lg border border-[#d5e4dc] px-4 py-2 text-sm font-semibold"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 px-5 py-10 sm:px-8">
        <section>
          <span className="text-xs font-bold uppercase tracking-[.18em] text-[#248262]">
            Safari Operator Workspace
          </span>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Welcome, {user.name}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#637b70]">
            Manage your safari company and prepare
            experiences for travelers across Africa.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#e0eae3] bg-white p-6">
            <p className="text-sm text-[#6c8175]">
              Company Verification
            </p>

            <strong className="mt-3 block text-lg">
              See company profile
            </strong>

            <p className="mt-2 text-xs text-[#6c8175]">
              Live status shown below
            </p>
          </article>

          <article className="rounded-2xl border border-[#e0eae3] bg-white p-6">
            <p className="text-sm text-[#6c8175]">
              My Safari Tours
            </p>

            <strong className="mt-3 block text-lg">
              Not yet loaded
            </strong>

            <p className="mt-2 text-xs text-[#6c8175]">
              Operator-owned tour data is not yet connected
            </p>
          </article>

          <article className="rounded-2xl border border-[#e0eae3] bg-white p-6">
            <p className="text-sm text-[#6c8175]">
              Tour Publishing
            </p>

            <strong className="mt-3 block text-lg">
              Not enabled
            </strong>

            <p className="mt-2 text-xs text-[#6c8175]">
              Requires verified operator authorization
            </p>
          </article>
        </section>

        <SafariCompanyPanel />

        <VendorToursPanel />
      </div>
    </main>
  );
}
