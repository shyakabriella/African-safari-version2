"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { AccountSession } from
  "@/lib/auth/sessions";

import profile from "./Profile.module.css";
import styles from "./Sessions.module.css";

type Selection =
  | { type: "all" }
  | { type: "single"; session: AccountSession };

const GLOBAL_EXPIRATION_MS = 1440 * 60 * 1000;

function effectiveExpiry(session: AccountSession) {
  const global = session.created_at
    ? Date.parse(session.created_at) +
      GLOBAL_EXPIRATION_MS
    : Infinity;

  const individual = session.expires_at
    ? Date.parse(session.expires_at)
    : Infinity;

  const expiry = Math.min(global, individual);

  return Number.isFinite(expiry) ? expiry : null;
}

function formatDate(value: string | number | null) {
  if (value === null) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export default function SessionsForm() {
  const [sessions, setSessions] =
    useState<AccountSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selection, setSelection] =
    useState<Selection | null>(null);

  const mutationLock = useRef(false);

  const load = useCallback(async (
    signal?: AbortSignal
  ) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/sessions",
        {
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: signal
            ? AbortSignal.any([
                signal,
                AbortSignal.timeout(20000),
              ])
            : AbortSignal.timeout(20000),
        }
      );

      if (signal?.aborted) return;

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const result = await response.json()
        .catch(() => null);

      if (signal?.aborted) return;

      if (
        !response.ok ||
        result?.success !== true ||
        !Array.isArray(result.data)
      ) {
        setSessions([]);
        setLoaded(false);
        setError(
          result?.message || "Unable to load sessions."
        );
        return;
      }

      setSessions(result.data);
      setNow(Date.now());
      setLoaded(true);

    } catch {
      if (signal?.aborted) return;

      setSessions([]);
      setLoaded(false);
      setError("Connection problem. Try again.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void load(controller.signal);

    const timer = window.setInterval(
      () => setNow(Date.now()),
      30000
    );

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [load]);

  async function revoke() {
    if (
      !selection ||
      loading ||
      busy ||
      mutationLock.current
    ) {
      return;
    }

    mutationLock.current = true;

    const selected = selection;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const endpoint = selected.type === "all"
        ? "/api/auth/logout-all"
        : `/api/auth/sessions/${selected.session.id}`;

      const response = await fetch(endpoint, {
        method: selected.type === "all"
          ? "POST"
          : "DELETE",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(40000),
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const result = await response.json()
        .catch(() => null);

      if (
        !response.ok ||
        result?.success !== true
      ) {
        setSelection(null);

        await load();

        setError(
          result?.message ||
          "Unable to confirm session revocation."
        );

        return;
      }

      if (
        selected.type === "all" ||
        result.current_session_revoked === true
      ) {
        window.location.replace("/login");
        return;
      }

      setSelection(null);
      setMessage("Session revoked successfully.");

      await load();

    } catch {
      setSelection(null);

      await load();

      setError(
        "Unable to confirm the request. Review your remaining sessions."
      );

    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  const activeCount = sessions.filter(session => {
    const expiry = effectiveExpiry(session);

    return expiry !== null && expiry > now;
  }).length;

  const ordered = [...sessions].sort((a, b) =>
    Number(b.is_current) - Number(a.is_current)
  );

  return (
    <div className={profile.page}>

      <Link
        href="/dashboard/profile"
        className={styles.back}
      >
        ← Back to My Profile
      </Link>

      <header className={profile.heading}>
        <span>ACCOUNT SECURITY</span>
        <h1>Active Sessions</h1>

        <p>
          Review your sessions and sign out
          from sessions you no longer use.
        </p>
      </header>

      <section className={profile.card}>

        <div className={styles.header}>

          <div>
            <h2>Your Sessions</h2>

            <p>
              {loaded
                ? `${activeCount} unexpired of ${sessions.length} stored sessions`
                : "Manage your sign-in sessions"}
            </p>
          </div>

          <button
            type="button"
            className={profile.cancel}
            disabled={loading || busy || !!selection}
            onClick={() => {
              setMessage("");
              void load();
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>

        </div>

        {message && (
          <p className={profile.successMessage} role="status">
            {message}
          </p>
        )}

        {error && (
          <p className={profile.errorMessage} role="alert">
            {error}
          </p>
        )}

        {loading && (
          <p className={styles.notice} role="status">
            Loading sessions...
          </p>
        )}

        {!loading && loaded && (
          <div className={styles.list}>

            {ordered.map(session => {
              const expiry = effectiveExpiry(session);

              const expired =
                expiry !== null && expiry <= now;

              return (
                <article
                  key={session.id}
                  className={styles.session}
                >

                  <div
                    className={styles.icon}
                    aria-hidden="true"
                  >
                    <svg
                      width="23"
                      height="23"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="13"
                        rx="2"
                      />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                  </div>

                  <div className={styles.details}>

                    <h3>
                      {session.is_current
                        ? "Current session"
                        : session.name || "Account session"}
                    </h3>

                    <p>Session #{session.id}</p>

                    <span className={
                      expired
                        ? styles.expired
                        : styles.status
                    }>
                      {expired
                        ? "Expired"
                        : session.is_current
                          ? "Current session"
                          : expiry === null
                            ? "Expiry unknown"
                            : "Unexpired"}
                    </span>

                    <dl>
                      <div>
                        <dt>Created</dt>
                        <dd>{formatDate(session.created_at)}</dd>
                      </div>

                      <div>
                        <dt>Last activity</dt>
                        <dd>{formatDate(session.last_used_at)}</dd>
                      </div>

                      <div>
                        <dt>Effective expiration</dt>
                        <dd>{formatDate(expiry)}</dd>
                      </div>
                    </dl>

                  </div>

                  <button
                    type="button"
                    className={styles.danger}
                    disabled={busy || !!selection}
                    onClick={() => setSelection({
                      type: "single",
                      session,
                    })}
                  >
                    {session.is_current
                      ? "Sign Out"
                      : expired
                        ? "Remove"
                        : "Revoke Session"}
                  </button>

                </article>
              );
            })}

          </div>
        )}

        {loaded && (
          <p className={styles.notice}>
            Sessions expire after a maximum of 24 hours.
            Dates are displayed in your local time zone.
          </p>
        )}

      </section>

      <section className={styles.dangerCard}>

        <div>
          <h2>Logout All Devices</h2>

          <p>
            Sign out of all sessions associated with
            your account. Your password will not change.
          </p>
        </div>

        <button
          type="button"
          className={styles.danger}
          disabled={
            busy ||
            loading ||
            !loaded ||
            !!selection
          }
          onClick={() => setSelection({
            type: "all",
          })}
        >
          Logout All Devices
        </button>

      </section>

      {selection && (
        <section
          className={styles.confirmation}
          role="region"
          aria-labelledby="confirm-session-title"
        >

          <h2 id="confirm-session-title">
            {selection.type === "all"
              ? "Sign out from all sessions?"
              : selection.session.is_current
                ? "Sign out of your current session?"
                : `Revoke session #${selection.session.id}?`}
          </h2>

          <p role="status">
            {selection.type === "all"
              ? "All existing account sessions will be revoked. You must sign in again."
              : selection.session.is_current
                ? "You will be returned to the sign-in page."
                : "The selected session will no longer have access to your account."}
          </p>

          <div className={profile.actions}>

            <button
              type="button"
              className={profile.cancel}
              disabled={busy}
              onClick={() => setSelection(null)}
            >
              Cancel
            </button>

            <button
              type="button"
              className={styles.confirm}
              disabled={busy}
              onClick={() => void revoke()}
            >
              {busy ? "Processing..." : "Confirm Sign Out"}
            </button>

          </div>

        </section>
      )}

    </div>
  );
}
