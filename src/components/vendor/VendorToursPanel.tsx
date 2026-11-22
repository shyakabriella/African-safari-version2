"use client";

import { useEffect, useState } from "react";
import VendorCreateTourModal from "./VendorCreateTourModal";

type SafariTour = {
  id: number;
  name: string;
  category: string;
  status: "draft" | "active" | "inactive";
  base_price: number;
  currency: string;
  duration_days: number | null;
  duration_hours: number | null;
};

type TourList = {
  tours: SafariTour[];
  total: number;
  current_page: number;
  last_page: number;
  company_status:
    | "pending"
    | "approved"
    | "rejected"
    | "suspended"
    | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: TourList;
};

const categories: Record<string, string> = {
  game_drive: "Game Drive",
  gorilla_trekking: "Gorilla Trekking",
  hiking: "Hiking",
  culture: "Cultural Safari",
  boat: "Boat Safari",
  birding: "Bird Watching",
  other: "Other Safari",
};

function statusClass(status: SafariTour["status"]) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "draft") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatPrice(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDuration(tour: SafariTour) {
  const parts: string[] = [];

  if (tour.duration_days) {
    parts.push(
      `${tour.duration_days} ${
        tour.duration_days === 1 ? "day" : "days"
      }`,
    );
  }

  if (tour.duration_hours) {
    parts.push(
      `${tour.duration_hours} ${
        tour.duration_hours === 1 ? "hour" : "hours"
      }`,
    );
  }

  return parts.length ? parts.join(", ") : "Not specified";
}

export default function VendorToursPanel() {
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<TourList | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTours() {
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: "10",
        });

        const response = await fetch(
          `/api/vendor/my-tours?${params.toString()}`,
          {
            method: "GET",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: ApiResponse = await response.json();

        if (!response.ok || result.success !== true) {
          throw new Error(
            result.message ||
              "Unable to load your Safari Tours.",
          );
        }

        if (
          !result.data ||
          !Array.isArray(result.data.tours) ||
          !Number.isSafeInteger(result.data.total) ||
          !Number.isSafeInteger(result.data.current_page) ||
          !Number.isSafeInteger(result.data.last_page)
        ) {
          throw new Error("Unexpected Safari Tours response.");
        }

        if (!controller.signal.aborted) {
          setData(result.data);
          setError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Safari Tours are temporarily unavailable.",
          );
          setData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTours();

    return () => controller.abort();
  }, [page, refreshKey]);

  function refreshTours() {
    setLoading(true);
    setError("");
    setRefreshKey(value => value + 1);
  }

  function changePage(nextPage: number) {
    if (loading || nextPage < 1) return;

    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  const approved = data?.company_status === "approved";

  return (
    <section className="rounded-2xl border border-[#e0eae3] bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#173c36]">
            My Safari Tours
          </h2>

          <p className="mt-2 text-sm leading-7 text-[#637b70]">
            View your company&apos;s safari packages,
            including unpublished drafts.
          </p>
        </div>

        {!loading && !error && approved ? (
          <VendorCreateTourModal onCreated={refreshTours} />
        ) : (
          <button
            type="button"
            disabled
            title="An approved Safari Operator company is required"
            className="cursor-not-allowed rounded-lg bg-[#186e52] px-5 py-3 text-sm font-bold text-white opacity-50"
          >
            + List New Safari
          </button>
        )}
      </div>

      {!loading && !error && data && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#637b70]">
            <span className="font-bold text-[#173c36]">
              {data.total}
            </span>{" "}
            {data.total === 1 ? "Safari Tour" : "Safari Tours"}
          </p>

          <button
            type="button"
            onClick={refreshTours}
            className="rounded-lg border border-[#d5e4dc] px-4 py-2 text-sm font-semibold text-[#186e52] hover:bg-[#f5f8f5]"
          >
            Refresh Tours
          </button>
        </div>
      )}

      {loading ? (
        <p
          role="status"
          className="mt-6 text-sm text-[#637b70]"
        >
          Loading your Safari Tours...
        </p>
      ) : error ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5"
        >
          <p className="text-sm text-red-800">{error}</p>

          <button
            type="button"
            onClick={refreshTours}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          {data.company_status !== "approved" && (
            <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {data.company_status === null
                ? "Register your safari company to begin the approval process."
                : data.company_status === "pending"
                  ? "Your company is awaiting approval. New Safari Tour creation is not available yet."
                  : data.company_status === "rejected"
                    ? "Your company was not approved. Contact marketplace support."
                    : "Your company is suspended. Safari Tour creation is unavailable."}
            </p>
          )}

          {approved && (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Your safari company is approved.
              You can now save new Safari Tours as Drafts.
            </p>
          )}

          {data.tours.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#cbded1] bg-[#f8faf8] p-6">
              <h3 className="font-bold text-[#173c36]">
                No Safari Tours yet
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#637b70]">
                Your company has not listed any safari packages.
                Your future Draft, Active, and Inactive tours
                will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-[#e0eae3]">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-[#f6f9f6] text-[#567065]">
                  <tr>
                    <th className="px-4 py-4 font-bold">
                      Safari Tour
                    </th>
                    <th className="px-4 py-4 font-bold">
                      Category
                    </th>
                    <th className="px-4 py-4 font-bold">
                      Duration
                    </th>
                    <th className="px-4 py-4 font-bold">
                      Base Price
                    </th>
                    <th className="px-4 py-4 font-bold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e0eae3]">
                  {data.tours.map(tour => (
                    <tr key={tour.id}>
                      <td className="px-4 py-4">
                        <p className="font-bold text-[#173c36]">
                          {tour.name}
                        </p>
                        <p className="mt-1 text-xs text-[#708579]">
                          Tour #{tour.id}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-[#526f62]">
                        {categories[tour.category] ??
                          "Safari Tour"}
                      </td>

                      <td className="px-4 py-4 text-[#526f62]">
                        {formatDuration(tour)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-[#173c36]">
                        {formatPrice(
                          tour.base_price,
                          tour.currency,
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusClass(tour.status)}`}
                        >
                          {tour.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.last_page > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#637b70]">
                Page {data.current_page} of {data.last_page}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1 || loading}
                  className="rounded-lg border border-[#d5e4dc] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={
                    page >= data.last_page || loading
                  }
                  className="rounded-lg border border-[#d5e4dc] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
