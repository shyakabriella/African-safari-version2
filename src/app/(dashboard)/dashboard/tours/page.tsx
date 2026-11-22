import type { Metadata } from "next";
import { Suspense } from "react";

import SafariToursOverview from
  "@/components/dashboard/tours/SafariToursOverview";

import {
  getAdminSafariCatalog,
  getAdminDepartureCount,
} from "@/lib/admin/safari-catalog";

// Authenticated catalog requests are evaluated per request.
// This page may wait for verification during navigation.
export const instant = false;

export const metadata: Metadata = {
  title: "Safari Tours | African Safaris",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

async function SafariToursContent({
  searchParams,
}: Props) {
  const parameters = await searchParams;

  const rawPage = parameters.page;

  const page = (
    typeof rawPage === "string" &&
    /^[1-9]\d{0,5}$/.test(rawPage)
  )
    ? Number(rawPage)
    : 1;

  const [catalog, departures] = await Promise.all([
    getAdminSafariCatalog(page),
    getAdminDepartureCount(),
  ]);

  return (
    <SafariToursOverview
      catalog={catalog}
      departures={departures}
    />
  );
}


export default function SafariToursPage(props: Props) {
  return (
    <Suspense fallback={
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: "24px",
          minHeight: "240px",
        }}
      >
        Loading Safari Tours...
      </div>
    }>
      <SafariToursContent {...props} />
    </Suspense>
  );
}
