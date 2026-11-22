import Link from "next/link";

import {
  type CatalogResult,
  type CatalogCountResult,
} from "@/lib/admin/safari-catalog";

import CreateSafariTour from "./CreateSafariTour";
import styles from "./SafariTours.module.css";

type Props = {
  catalog: CatalogResult;
  departures: CatalogCountResult;
};

function readablePrice(
  amount: string | null,
  currency: string | null,
): string {
  if (!amount || !currency) {
    return "Not available";
  }

  const number = Number(amount);

  if (!Number.isFinite(number)) {
    return "Not available";
  }

  return `${currency} ${number.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
}

export default function SafariToursOverview({
  catalog,
  departures,
}: Props) {
  const tours = catalog.ok
    ? catalog.data.tours
    : [];

  const tourCount = catalog.ok
    ? catalog.data.total
    : null;

  const departureCount = departures.ok
    ? departures.total
    : null;

  return (
    <div className={styles.container}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            Safari Marketplace
          </span>

          <h1>Safari Tours</h1>

          <p>
            View publicly listed safari experiences,
            departure availability, and itinerary
            management readiness.
          </p>
        </div>

        <span className={styles.status}>
          Catalog Overview
        </span>
      </header>

      <section className={styles.stats}>
        <article className={styles.statCard}>
          <span>All Safari Tours</span>
          <strong>
            {tourCount === null
              ? "—"
              : tourCount.toLocaleString("en-US")}
          </strong>
          <small>
            {tourCount === null
              ? "Data unavailable"
              : "Across all tour statuses"}
          </small>
        </article>

        <article className={styles.statCard}>
          <span>All Departures</span>
          <strong>
            {departureCount === null
              ? "—"
              : departureCount.toLocaleString("en-US")}
          </strong>
          <small>
            {departureCount === null
              ? "Data unavailable"
              : "Across all departure statuses"}
          </small>
        </article>

        <article className={styles.statCard}>
          <span>Itinerary Management</span>
          <strong className={styles.statusValue}>
            API Ready
          </strong>
          <small>
            Editing interface coming next
          </small>
        </article>
      </section>

      <CreateSafariTour />

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Safari Catalog</h2>
            <p>
              Tour information retrieved through the
              authenticated administrator API.
            </p>
          </div>
        </div>

        {!catalog.ok ? (
          <div
            className={styles.empty}
            role="status"
          >
            <strong>
              Safari data is unavailable
            </strong>
            <p>{catalog.message}</p>
          </div>
        ) : tours.length === 0 ? (
          <div
            className={styles.empty}
            role="status"
          >
            <strong>
              No safari tours found
            </strong>
            <p>
              No safari tours exist on this page.
              Create a tour using the upcoming
              administrator management form.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Safari Tour</th>
                  <th>Duration</th>
                  <th>Base Price</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {tours.map((tour) => (
                  <tr key={tour.id}>
                    <td>
                      <strong>{tour.name}</strong>
                      <small>
                        Tour ID: {tour.id}
                      </small>
                    </td>
                    <td>
                      {tour.durationDays !== null
                        ? `${tour.durationDays} days`
                        : "—"}
                    </td>
                    <td>
                      {readablePrice(
                        tour.basePrice,
                        tour.currency,
                      )}
                    </td>
                    <td>
                      <span className={styles.chip}>
                        {tour.status ?? "Not specified"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {catalog.ok && (
          <div className={styles.pagination}>
            <span>
              Page {catalog.data.currentPage}
              {" of "}
              {catalog.data.lastPage}
            </span>

            <div className={styles.pageLinks}>
              {catalog.data.currentPage > 1 && (
                <Link
                  href={`/dashboard/tours?page=${
                    catalog.data.currentPage - 1
                  }`}
                >
                  Previous
                </Link>
              )}

              {catalog.data.currentPage <
                catalog.data.lastPage && (
                <Link
                  href={`/dashboard/tours?page=${
                    catalog.data.currentPage + 1
                  }`}
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Upcoming Management Features</h2>
            <p>
              These functions will use protected
              Laravel administrator APIs.
            </p>
          </div>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <strong>Tour Management</strong>
            <p>
              Create, edit, review and manage safari
              tour listings.
            </p>
          </div>

          <div className={styles.feature}>
            <strong>Departure Schedules</strong>
            <p>
              Manage departure dates, traveler limits
              and availability.
            </p>
          </div>

          <div className={styles.feature}>
            <strong>Safari Itineraries</strong>
            <p>
              Build day-by-day plans, activities,
              accommodation and published versions.
            </p>
          </div>
        </div>
      </section>

      <p className={styles.note}>
        Tour and departure counts include all
        statuses available to administrators.
        Payment and confirmed-booking actions
        remain disabled.
      </p>
    </div>
  );
}
