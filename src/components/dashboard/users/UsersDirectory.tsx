"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  DirectoryPage,
  DirectoryQuery,
} from "@/lib/admin/directory";

import type {
  AccountRole,
} from "@/lib/auth/roles";

import styles from "./UsersDirectory.module.css";

const roleLabels: Record<AccountRole, string> = {
  admin: "Administrator",
  customer: "Customer",
  vendor: "Vendor",
  partner: "Partner",
  agent: "Agent",
};

const initialQuery: DirectoryQuery = {
  search: "",
  role: null,
  is_active: null,
  page: 1,
  per_page: 20,
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join("") || "U";
}

function queryString(query: DirectoryQuery) {
  const params = new URLSearchParams();

  params.set("page", String(query.page));

  params.set(
    "per_page",
    String(query.per_page)
  );

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.role !== null) {
    params.set("role", query.role);
  }

  if (query.is_active !== null) {
    params.set(
      "is_active",
      query.is_active
    );
  }

  return params.toString();
}

export default function UsersDirectory() {
  const [search, setSearch] = useState("");

  const [query, setQuery] =
    useState<DirectoryQuery>(initialQuery);

  const [result, setResult] =
    useState<DirectoryPage | null>(null);

  const [error, setError] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [revision, setRevision] =
    useState(0);

  function changeQuery(
    changes: Partial<DirectoryQuery>
  ) {
    setLoading(true);
    setError("");
    setResult(null);

    setQuery(previous => ({
      ...previous,
      ...changes,
    }));
  }

  function searchUsers(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    changeQuery({
      search: search.trim(),
      page: 1,
    });
  }

  function reset() {
    setSearch("");
    changeQuery(initialQuery);
  }

  function refresh() {
    setLoading(true);
    setResult(null);
    setError("");
    setRevision(previous => previous + 1);
  }

  useEffect(() => {
    const controller = new AbortController();

    let current = true;

    const timeout = setTimeout(() => {
      controller.abort();

      if (current) {
        setError(
          "The request timed out. Please try again."
        );

        setLoading(false);
      }
    }, 35000);

    async function load() {
      try {
        const response = await fetch(
          `/api/admin/users?${queryString(query)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!current || controller.signal.aborted) {
          return;
        }

        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        if (response.status === 403) {
          setResult(null);

          window.location.replace(
            "/auth/continue"
          );

          return;
        }

        const payload = await response.json()
          .catch(() => null);

        if (!current || controller.signal.aborted) {
          return;
        }

        if (
          !response.ok ||
          payload?.success !== true ||
          !payload.data ||
          !Array.isArray(payload.data.users)
        ) {
          setError(
            typeof payload?.message === "string"
              ? payload.message
              : "Unable to load the users directory."
          );

          setResult(null);
          return;
        }

        const data: DirectoryPage = payload.data;

        // A filtered or changed dataset can leave
        // the requested page beyond the last page.
        if (data.current_page > data.last_page) {
          setQuery(previous => ({
            ...previous,
            page: data.last_page,
          }));

          return;
        }

        setResult(data);

      } catch {
        if (current && !controller.signal.aborted) {
          setError(
            "Connection problem. Please try again."
          );

          setResult(null);
        }
      } finally {
        clearTimeout(timeout);

        if (current) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      current = false;

      clearTimeout(timeout);

      controller.abort();
    };
  }, [query, revision]);

  const hasFilters =
    query.search !== "" ||
    query.role !== null ||
    query.is_active !== null;

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2>Users Directory</h2>
          <p>
            Search and manage registered platform
            accounts.
          </p>
        </div>

        <button
          type="button"
          className={styles.secondary}
          disabled={loading}
          onClick={refresh}
        >
          Refresh list
        </button>
      </header>

      <div className={styles.filters}>
        <form
          className={styles.searchForm}
          onSubmit={searchUsers}
        >
          <label className={styles.searchField}>
            <span>Search users</span>

            <input
              type="search"
              value={search}
              maxLength={190}
              placeholder="Name, email or phone"
              onChange={event =>
                setSearch(event.target.value)
              }
            />
          </label>

          <button
            type="submit"
            className={styles.primary}
          >
            Search
          </button>
        </form>

        <label className={styles.field}>
          Account role

          <select
            value={query.role ?? ""}
            onChange={event => {
              const value = event.target.value;

              changeQuery({
                role: value
                  ? value as AccountRole
                  : null,
                page: 1,
              });
            }}
          >
            <option value="">All roles</option>

            {Object.entries(roleLabels).map(
              ([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              )
            )}
          </select>
        </label>

        <label className={styles.field}>
          Account status

          <select
            value={query.is_active ?? ""}
            onChange={event => {
              const value = event.target.value;

              changeQuery({
                is_active:
                  value === "1" || value === "0"
                    ? value
                    : null,
                page: 1,
              });
            }}
          >
            <option value="">All statuses</option>
            <option value="1">Active</option>
            <option value="0">Suspended</option>
          </select>
        </label>

        <label className={styles.field}>
          Per page

          <select
            value={query.per_page}
            onChange={event =>
              changeQuery({
                per_page: Number(event.target.value),
                page: 1,
              })
            }
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={styles.secondary}
          onClick={reset}
          disabled={
            !hasFilters &&
            !search &&
            query.per_page === 20 &&
            query.page === 1
          }
        >
          Reset
        </button>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {loading && (
          <div
            className={styles.empty}
            role="status"
          >
            <span
              className={styles.spinner}
              aria-hidden="true"
            />

            <strong>Loading users...</strong>

            <p>Retrieving current account information.</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.failure}>
            <p role="alert">{error}</p>

            <button
              type="button"
              className={styles.secondary}
              onClick={refresh}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && result && (
          <>
            {result.users.length === 0 ? (
              <div className={styles.empty}>
                <strong>No users found</strong>

                <p>
                  {hasFilters
                    ? "Try different search terms or filters."
                    : "No accounts are currently available."}
                </p>

                {hasFilters && (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={reset}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div
                className={styles.tableWrap}
                tabIndex={0}
                role="region"
                aria-label="Registered users table"
              >
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Account</th>
                      <th scope="col">Phone number</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Registered</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.identity}>
                            <span
                              className={styles.avatar}
                              aria-hidden="true"
                            >
                              {initials(user.name)}
                            </span>

                            <div className={styles.account}>
                              <strong>{user.name}</strong>

                              <small>{user.email}</small>

                              <small>
                                Account #{user.id}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>{user.phone || "—"}</td>

                        <td>
                          <span className={styles.role}>
                            {roleLabels[user.role]}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              user.is_active
                                ? styles.active
                                : styles.inactive
                            }
                          >
                            <i aria-hidden="true" />

                            {user.is_active
                              ? "Active"
                              : "Suspended"}
                          </span>
                        </td>

                        <td>
                          {formatDate(user.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <footer className={styles.pagination}>
              <p>
                {result.total === 0
                  ? "0 accounts"
                  : `Showing ${result.from ?? 0}–${result.to ?? 0} of ${result.total} accounts`}
              </p>

              <div className={styles.pageButtons}>
                <button
                  type="button"
                  disabled={query.page <= 1}
                  onClick={() =>
                    changeQuery({
                      page: query.page - 1,
                    })
                  }
                >
                  Previous
                </button>

                <span>
                  Page {result.current_page} of{" "}
                  {result.last_page}
                </span>

                <button
                  type="button"
                  disabled={
                    query.page >= result.last_page ||
                    query.page >= 1000000
                  }
                  onClick={() =>
                    changeQuery({
                      page: query.page + 1,
                    })
                  }
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </section>
  );
}
