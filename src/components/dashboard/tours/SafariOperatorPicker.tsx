"use client";

import { useEffect, useState } from "react";
import styles from "./SafariOperatorPicker.module.css";

type Operator = {
  id: number;
  display_name: string;
};

type Directory = {
  operators: Operator[];
  total: number;
  current_page: number;
  last_page: number;
};

export default function SafariOperatorPicker() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [selected, setSelected] = useState("");
  const [directory, setDirectory] =
    useState<Directory | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    // Async callback: no synchronous state updates
    // occur directly inside this effect.
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError("");
      setDirectory(null);

      try {
        const params = new URLSearchParams({
          search: search.trim(),
          page: String(page),
        });

        const response = await fetch(
          `/api/admin/safari-operators?${params}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const payload: unknown = await response.json();

        if (
          typeof payload !== "object" ||
          payload === null ||
          !("success" in payload) ||
          payload.success !== true ||
          !("data" in payload) ||
          typeof payload.data !== "object" ||
          payload.data === null ||
          !("operators" in payload.data) ||
          !Array.isArray(payload.data.operators)
        ) {
          throw new Error(
            "Unable to load the operator directory."
          );
        }

        if (!response.ok) {
          throw new Error(
            "Unable to load approved operators."
          );
        }

        if (!controller.signal.aborted) {
          setDirectory(payload.data as Directory);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError(
            "Approved operators are unavailable. Please retry."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, page, retryKey]);

  const operators = directory?.operators ?? [];

  function updateSearch(value: string) {
    setLoading(true);
    setSelected("");
    setDirectory(null);
    setError("");
    setPage(1);
    setSearch(value);
  }

  function changePage(next: number) {
    setLoading(true);
    setSelected("");
    setDirectory(null);
    setError("");
    setPage(next);
  }

  return (
    <div className={styles.picker}>
      <label className={styles.fieldLabel}>
        Search Safari Operator
        <input
          type="search"
          className={styles.input}
          maxLength={100}
          placeholder="Search approved business names"
          value={search}
          onChange={(event) => {
            updateSearch(event.target.value);
          }}
        />
      </label>

      <label className={styles.fieldLabel}>
        Approved Safari Operator *
        <select
          name="vendor_id"
          className={styles.input}
          value={selected}
          required
          disabled={
            loading ||
            !!error ||
            operators.length === 0
          }
          onChange={(event) => {
            setSelected(event.target.value);
          }}
        >
          <option value="">
            {loading
              ? "Loading approved operators..."
              : "Select an operator"}
          </option>

          {operators.map((operator) => (
            <option
              key={operator.id}
              value={operator.id}
            >
              {operator.display_name}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setRetryKey((current) => current + 1);
            }}
          >
            Retry search
          </button>
        </div>
      )}

      {!loading && !error && operators.length === 0 && (
        <p className={styles.info} role="status">
          No approved safari operators found.
          Try another name or review operator approvals.
        </p>
      )}

      {!loading && directory && !error && (
        <div className={styles.footer}>
          <span>
            {directory.total} approved operator
            {directory.total === 1 ? "" : "s"} found
          </span>

          <div className={styles.pagination}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => changePage(page - 1)}
            >
              Previous
            </button>

            <span>
              {directory.current_page} / {directory.last_page}
            </span>

            <button
              type="button"
              disabled={page >= directory.last_page}
              onClick={() => changePage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <p className={styles.hint}>
        Only approved safari operators appear here.
        Select the correct business before saving a tour.
      </p>
    </div>
  );
}
