"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";

import SafariOperatorPicker from "./SafariOperatorPicker";
import styles from "./CreateSafariTour.module.css";

const categories = [
  ["game_drive", "Game Drive"],
  ["gorilla_trekking", "Gorilla Trekking"],
  ["hiking", "Hiking"],
  ["culture", "Cultural Safari"],
  ["boat", "Boat Safari"],
  ["birding", "Bird Watching"],
  ["other", "Other"],
] as const;

export default function CreateSafariTour() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [open]);

  function closeModal() {
    if (saving) return;

    setOpen(false);
    setError("");
  }

  async function createTour(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) return;

    const form = event.currentTarget;
    const values = new FormData(form);

    const vendorId = Number(
      values.get("vendor_id")
    );

    const name = String(
      values.get("name") ?? ""
    ).trim();

    const price = String(
      values.get("base_price") ?? ""
    ).trim();

    const minSize = String(
      values.get("group_size_min") ?? ""
    );

    const maxSize = String(
      values.get("group_size_max") ?? ""
    );

    if (
      !Number.isSafeInteger(vendorId) ||
      vendorId < 1 ||
      !name ||
      !/^\d{1,10}(\.\d{1,2})?$/.test(price)
    ) {
      setError(
        "Enter a valid vendor ID, safari name and price."
      );
      return;
    }

    if (
      minSize &&
      maxSize &&
      Number(maxSize) < Number(minSize)
    ) {
      setError(
        "Maximum group size cannot be smaller than minimum."
      );
      return;
    }

    const payload = {
      vendor_id: vendorId,
      name,
      description: String(
        values.get("description") ?? ""
      ).trim(),
      category: String(
        values.get("category") ?? "other"
      ),
      duration_days: Number(
        values.get("duration_days") ?? 1
      ),
      duration_hours: Number(
        values.get("duration_hours") ?? 0
      ),
      base_price: price,
      currency: String(
        values.get("currency") ?? "USD"
      ).toUpperCase(),
      ...(minSize
        ? { group_size_min: Number(minSize) }
        : {}),
      ...(maxSize
        ? { group_size_max: Number(maxSize) }
        : {}),
      status: "draft",
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/tours",
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
          cache: "no-store",
        }
      );

      const result = await response.json()
        .catch(() => null);

      if (!response.ok || result?.success !== true) {
        throw new Error(
          result?.message ??
            "Tour could not be created."
        );
      }

      setMessage(
        `Draft safari tour #${result.data.id} created.`
      );

      form.reset();
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to confirm tour creation."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.heading}>
        <div>
          <h2>Safari Tour Management</h2>
          <p>
            Create and manage your safari packages.
          </p>
        </div>

        <button
          type="button"
          className={styles.primary}
          onClick={() => {
            setError("");
            setOpen(true);
          }}
          disabled={saving}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          + New Safari Tour
        </button>
      </div>

      {message && (
        <p className={styles.success} role="status">
          {message}
        </p>
      )}

      {open && (
        <dialog
          ref={dialogRef}
          className={styles.modal}
          aria-labelledby="create-safari-modal-title"
          aria-describedby="create-safari-modal-description"
          onCancel={(event) => {
            if (saving) {
              event.preventDefault();
            } else {
              closeModal();
            }
          }}
          onClose={closeModal}
          onClick={(event) => {
            if (saving || event.target !== event.currentTarget) {
              return;
            }

            const rectangle =
              event.currentTarget.getBoundingClientRect();

            const outside =
              event.clientX < rectangle.left ||
              event.clientX > rectangle.right ||
              event.clientY < rectangle.top ||
              event.clientY > rectangle.bottom;

            if (outside) {
              closeModal();
            }
          }}
        >
          <div className={styles.modalHeader}>
            <div>
              <span className={styles.eyebrow}>
                Safari Marketplace
              </span>
              <h2 id="create-safari-modal-title">
                Create Safari Tour
              </h2>
              <p id="create-safari-modal-description">
                Complete the details below to save a new
                safari package as a draft.
              </p>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={closeModal}
              disabled={saving}
              aria-label="Close Create Safari Tour"
            >
              ×
            </button>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

        <form
          className={styles.form}
          onSubmit={createTour}
        >
          <div className={styles.grid}>
            <SafariOperatorPicker />

            <label>
              Safari Name *
              <input
                name="name"
                maxLength={180}
                required
                placeholder="Example: Akagera Wildlife Safari"
              />
            </label>

            <label>
              Safari Category
              <select
                name="category"
                defaultValue="game_drive"
              >
                {categories.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Base Price *
              <input
                name="base_price"
                type="text"
                inputMode="decimal"
                pattern="[0-9]+(\.[0-9]{1,2})?"
                placeholder="250.00"
                required
              />
            </label>

            <label>
              Currency
              <select
                name="currency"
                defaultValue="USD"
              >
                {[
                  "USD", "RWF", "EUR", "GBP",
                  "KES", "UGX", "TZS",
                ].map(currency => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Duration (Days)
              <input
                name="duration_days"
                type="number"
                min="0"
                max="3650"
                defaultValue="1"
                required
              />
            </label>

            <label>
              Additional Hours
              <input
                name="duration_hours"
                type="number"
                min="0"
                max="24"
                defaultValue="0"
                required
              />
            </label>

            <label>
              Minimum Group Size
              <input
                name="group_size_min"
                type="number"
                min="1"
                max="1000"
              />
            </label>

            <label>
              Maximum Group Size
              <input
                name="group_size_max"
                type="number"
                min="1"
                max="1000"
              />
            </label>

            <label className={styles.wide}>
              Safari Description
              <textarea
                name="description"
                rows={4}
                maxLength={10000}
                placeholder="Describe the safari experience..."
              />
            </label>
          </div>

          <p className={styles.note}>
            Select an approved operator by business name.
            All newly created safaris remain drafts until
            they are explicitly published.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>

            <button
              className={styles.primary}
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Save Draft Safari"}
            </button>
          </div>
        </form>
        </dialog>
      )}
    </div>
  );
}
