"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import styles from "./OperatorVerification.module.css";

type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

type Owner = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

type Operator = {
  id: number;
  legal_name: string;
  display_name: string;
  tax_id: string | null;
  type: "safari_operator";
  status: Status;
  owner: Owner | null;
  created_at: string;
};

type Directory = {
  data: Operator[];
  total: number;
  current_page: number;
  last_page: number;
};

type ApiPayload = {
  success: boolean;
  message?: string;
  data?: unknown;
};

const statusOptions: Status[] = [
  "pending",
  "approved",
  "rejected",
  "suspended",
];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function isOwner(value: unknown): value is Owner | null {
  if (value === null) return true;

  return (
    isRecord(value) &&
    isPositiveInteger(value.id) &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    (value.phone === null ||
      typeof value.phone === "string")
  );
}

function isOperator(value: unknown): value is Operator {
  if (!isRecord(value)) return false;

  return (
    isPositiveInteger(value.id) &&
    typeof value.legal_name === "string" &&
    typeof value.display_name === "string" &&
    (value.tax_id === null ||
      typeof value.tax_id === "string") &&
    value.type === "safari_operator" &&
    statusOptions.includes(value.status as Status) &&
    typeof value.created_at === "string" &&
    isOwner(value.owner)
  );
}

function parseDirectory(value: unknown): Directory | null {
  if (!isRecord(value)) return null;

  if (
    !Array.isArray(value.data) ||
    value.data.length > 20 ||
    !value.data.every(isOperator) ||
    !Number.isSafeInteger(value.total) ||
    Number(value.total) < 0 ||
    !isPositiveInteger(value.current_page) ||
    !isPositiveInteger(value.last_page)
  ) {
    return null;
  }

  return {
    data: value.data,
    total: value.total as number,
    current_page: value.current_page,
    last_page: value.last_page,
  };
}

async function readPayload(
  response: Response,
): Promise<ApiPayload | null> {
  const payload: unknown = await response.json()
    .catch(() => null);

  if (
    !isRecord(payload) ||
    typeof payload.success !== "boolean"
  ) {
    return null;
  }

  return {
    success: payload.success,
    message: typeof payload.message === "string"
      ? payload.message
      : undefined,
    data: payload.data,
  };
}

function displayDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OperatorVerification() {
  const router = useRouter();

  const [status, setStatus] = useState<Status>("pending");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [directory, setDirectory] =
    useState<Directory | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selected, setSelected] =
    useState<Operator | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAccess = useCallback(
    (code: number): boolean => {
      if (code === 401) {
        router.replace("/login");
        return true;
      }

      if (code === 403) {
        router.replace("/auth/continue");
        return true;
      }

      return false;
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      try {
        const params = new URLSearchParams({
          status,
          page: String(page),
        });

        const response = await fetch(
          `/api/admin/safari-operator-applications?${params}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return;
        if (handleAccess(response.status)) return;

        const payload = await readPayload(response);
        const data = parseDirectory(payload?.data);

        if (!response.ok || !payload?.success || !data) {
          throw new Error(
            payload?.message ||
              "Unable to load Safari Operator applications.",
          );
        }

        if (data.current_page > data.last_page) {
          setPage(data.last_page);
          return;
        }

        setDirectory(data);
        setError("");
      } catch (cause) {
        if (!controller.signal.aborted) {
          setDirectory(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load applications.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadApplications();

    return () => controller.abort();
  }, [status, page, revision, handleAccess]);

  function refresh() {
    setLoading(true);
    setError("");
    setDirectory(null);
    setRevision(value => value + 1);
  }

  function changeStatus(next: Status) {
    if (busy) return;

    setStatus(next);
    setPage(1);
    setSelected(null);
    setReason("");
    setError("");
    setNotice("");
    setDirectory(null);
    setLoading(true);
  }

  function changePage(next: number) {
    if (loading || busy || next < 1) return;

    setPage(next);
    setSelected(null);
    setDirectory(null);
    setError("");
    setLoading(true);
  }

  async function review(id: number) {
    if (busy || detailLoading) return;

    setDetailLoading(true);
    setSelected(null);
    setReason("");
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/safari-operator-applications/${id}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (handleAccess(response.status)) return;

      const payload = await readPayload(response);

      if (
        !response.ok ||
        !payload?.success ||
        !isOperator(payload.data)
      ) {
        throw new Error(
          payload?.message ||
            "Unable to load company details.",
        );
      }

      setSelected(payload.data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to review company.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function decide(
    decision: "approved" | "rejected",
  ) {
    if (
      !selected ||
      busy ||
      selected.status !== "pending"
    ) {
      return;
    }

    const rejectionReason = reason.trim();

    if (
      decision === "rejected" &&
      rejectionReason.length === 0
    ) {
      setError("Enter a rejection reason first.");
      return;
    }

    if (
      rejectionReason.length > 1000
    ) {
      setError("The reason is too long.");
      return;
    }

    const message = decision === "approved"
      ? `Approve ${selected.display_name}? The operator will then be able to create Safari Tours.`
      : `Reject ${selected.display_name}? The decision will be recorded.`;

    if (!window.confirm(message)) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/safari-operator-applications/${selected.id}/decision`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            decision,
            ...(decision === "rejected"
              ? { reason: rejectionReason }
              : {}),
          }),
        },
      );

      if (handleAccess(response.status)) return;

      const payload = await readPayload(response);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message ||
            "Unable to save the approval decision.",
        );
      }

      setSelected(null);
      setReason("");
      setNotice(
        decision === "approved"
          ? "Safari Operator approved successfully."
          : "Safari Operator rejected successfully.",
      );
      refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save the decision.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            OPERATOR MANAGEMENT
          </span>

          <h1>Safari Operator Verification</h1>

          <p>
            Review registered Safari companies and manage
            approval decisions.
          </p>
        </div>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={refresh}
          disabled={loading || busy}
        >
          Refresh Applications
        </button>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Company Applications</h2>
            <p>
              Only approved operators can create Safari Tours.
            </p>
          </div>

          <span className={styles.count}>
            {directory?.total ?? "—"} applications
          </span>
        </div>

        <div
          className={styles.tabs}
          role="group"
          aria-label="Application status"
        >
          {statusOptions.map(item => (
            <button
              key={item}
              type="button"
              className={
                item === status
                  ? styles.activeTab
                  : styles.tab
              }
              aria-pressed={item === status}
              onClick={() => changeStatus(item)}
              disabled={busy}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        {notice && (
          <p role="status" className={styles.success}>
            {notice}
          </p>
        )}

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        {loading ? (
          <p role="status" className={styles.empty}>
            Loading applications...
          </p>
        ) : directory && directory.data.length === 0 ? (
          <p className={styles.empty}>
            No {status} applications found.
          </p>
        ) : directory ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Owner</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {directory.data.map(operator => (
                    <tr key={operator.id}>
                      <td>
                        <strong>
                          {operator.display_name}
                        </strong>
                        <small>{operator.legal_name}</small>
                      </td>

                      <td>
                        {operator.owner?.name ?? "—"}
                      </td>

                      <td>
                        {displayDate(operator.created_at)}
                      </td>

                      <td>
                        <span className={styles.status}>
                          {operator.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => void review(operator.id)}
                          disabled={busy || detailLoading}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <span>
                Page {directory.current_page} of{" "}
                {directory.last_page}
              </span>

              <div>
                <button
                  type="button"
                  disabled={
                    loading ||
                    busy ||
                    directory.current_page <= 1
                  }
                  onClick={() => changePage(page - 1)}
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    loading ||
                    busy ||
                    directory.current_page >=
                      directory.last_page
                  }
                  onClick={() => changePage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {detailLoading && (
        <p role="status">Loading company details...</p>
      )}

      {selected && (
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h2>
                Review Application #{selected.id}
              </h2>
              <p>
                Check the company details before deciding.
              </p>
            </div>

            <button
              type="button"
              className={styles.secondaryButton}
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <dl className={styles.details}>
            <div>
              <dt>Company name</dt>
              <dd>{selected.display_name}</dd>
            </div>

            <div>
              <dt>Legal name</dt>
              <dd>{selected.legal_name}</dd>
            </div>

            <div>
              <dt>Registration / Tax ID</dt>
              <dd>{selected.tax_id || "Not provided"}</dd>
            </div>

            <div>
              <dt>Account owner</dt>
              <dd>{selected.owner?.name || "—"}</dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>{selected.owner?.email || "—"}</dd>
            </div>

            <div>
              <dt>Phone</dt>
              <dd>{selected.owner?.phone || "—"}</dd>
            </div>

            <div>
              <dt>Registered</dt>
              <dd>{displayDate(selected.created_at)}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>{selected.status}</dd>
            </div>
          </dl>

          {selected.status === "pending" && (
            <div className={styles.decisionArea}>
              <p>
                Review the company information before
                approving or rejecting this application.
              </p>

              <label htmlFor="operator-rejection-reason">
                Rejection reason
              </label>

              <textarea
                id="operator-rejection-reason"
                value={reason}
                onChange={event =>
                  setReason(event.target.value)
                }
                rows={3}
                maxLength={1000}
                placeholder="Required when rejecting..."
                disabled={busy}
              />

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.approveButton}
                  disabled={busy}
                  onClick={() =>
                    void decide("approved")
                  }
                >
                  {busy
                    ? "Saving..."
                    : "Approve Operator"}
                </button>

                <button
                  type="button"
                  className={styles.rejectButton}
                  disabled={busy || !reason.trim()}
                  onClick={() =>
                    void decide("rejected")
                  }
                >
                  Reject Application
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
