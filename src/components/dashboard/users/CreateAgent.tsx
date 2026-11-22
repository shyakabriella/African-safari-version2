"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import styles from "./CreateAgent.module.css";

type Fields = {
  name: string;
  email: string;
  phone: string;
};

const empty: Fields = {
  name: "",
  email: "",
  phone: "",
};

type ApiResult = {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    role?: string;
    email?: string;
  };
  errors?: Record<string, string[]>;
  outcome_uncertain?: boolean;
};

export default function CreateAgent({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Fields>(empty);
  const [busy, setBusy] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const lock = useRef(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstInput.current?.focus();

    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !lock.current) {
        setOpen(false);
      }
      if (event.key === "Tab" && dialog.current) {
        const items = Array.from(
          dialog.current.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), a[href]"
          )
        );
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keyboard);
    };
  }, [open]);

  function close() {
    if (lock.current) return;
    setOpen(false);
    setValues(empty);
    setErrors({});
    setMessage("");
    setUncertain(false);
    setSuccessId(null);
  }

  function update(field: keyof Fields, value: string) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: [] }));
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || uncertain) return;

    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    const phone = values.phone.trim();
    const nextErrors: Record<string, string[]> = {};

    if (!name || name.length > 120) {
      nextErrors.name = ["Enter a valid full name."];
    }
    if (
      !email ||
      email.length > 190 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      nextErrors.email = ["Enter a valid email address."];
    }
    if (phone.length > 40) {
      nextErrors.phone = ["Phone number is too long."];
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    lock.current = true;
    setBusy(true);
    setMessage("");

    try {
      // Dedicated invitation API; never send passwords.
      const response = await fetch(
        "/api/admin/agents/invitations",
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            phone: phone || null,
          }),
        }
      );

      const result: ApiResult | null =
        await response.json().catch(() => null);

      if (
        response.status === 201 &&
        result?.success === true &&
        Number.isSafeInteger(result.data?.id) &&
        result.data?.role === "agent" &&
        result.data?.email === email
      ) {
        setSuccessId(result.data.id!);
        setMessage("Invitation sent successfully.");
        setValues(empty);
        onCreated();
        return;
      }

      if (response.status === 422 && result?.errors) {
        const cleaned: Record<string, string[]> = {};
        for (const field of ["name", "email", "phone"]) {
          if (Array.isArray(result.errors[field])) {
            cleaned[field] = result.errors[field]
              .filter((entry): entry is string => typeof entry === "string")
              .slice(0, 2)
              .map(entry => entry.slice(0, 150));
          }
        }
        setErrors(cleaned);
      }

      const unsure =
        result?.outcome_uncertain === true ||
        response.status >= 500;

      setUncertain(unsure);

      setMessage(
        unsure
          ? "Invitation status could not be confirmed. Check the Users Directory before trying again."
          : response.status === 401
            ? "Your session expired. Please sign in again."
            : response.status === 403
              ? "Administrator access is required."
              : result?.message ||
                "Unable to send invitation. Please check the details."
      );
    } catch {
      setUncertain(true);
      setMessage(
        "Connection interrupted. Check the Users Directory before attempting again."
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h2>Agent Accounts</h2>
          <p>Invite safari sales agents by email.</p>
        </div>
        <button
          type="button"
          className={styles.primary}
          onClick={() => setOpen(true)}
        >
          + Create Agent
        </button>
      </div>

      {open && (
        <div
          className={styles.overlay}
          onMouseDown={event => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-modal-title"
            ref={dialog}
          >
            <div className={styles.modalHeading}>
              <div>
                <h2 id="agent-modal-title">Create Agent</h2>
                <p>Send an invitation to join African Safaris.</p>
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={close}
                disabled={busy}
                aria-label="Close Create Agent modal"
              >
                ×
              </button>
            </div>

            {successId !== null ? (
              <div className={styles.body}>
                <div className={styles.success} role="status">
                  <strong>Invitation created</strong>
                  <p>{message}</p>
                  <p>
                    The agent can activate their account
                    using the secure link in their email.
                  </p>
                </div>
                <div className={styles.actions}>
                  <Link
                    href={`/dashboard/users/${successId}`}
                    className={styles.primary}
                  >
                    View Agent
                  </Link>
                  <button className={styles.secondary}
                    type="button" onClick={close}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form className={styles.body} onSubmit={submit}>
                {message && (
                  <div className={styles.warning} role="alert">
                    {message}
                  </div>
                )}

                {(["name", "email", "phone"] as const).map(field => (
                  <label className={styles.field} key={field}>
                    <span>
                      {field === "name" ? "Full Name"
                        : field === "email" ? "Email Address"
                        : "Phone Number (optional)"}
                      {field !== "phone" && " *"}
                    </span>
                    <input
                      ref={field === "name" ? firstInput : undefined}
                      type={field === "email" ? "email" :
                        field === "phone" ? "tel" : "text"}
                      autoComplete={field === "name" ? "name" :
                        field === "phone" ? "tel" : "off"}
                      value={values[field]}
                      maxLength={field === "name" ? 120 :
                        field === "email" ? 190 : 40}
                      onChange={event =>
                        update(field, event.target.value)}
                      required={field !== "phone"}
                      disabled={busy || uncertain}
                      aria-invalid={Boolean(errors[field]?.length)}
                      placeholder={field === "name"
                        ? "Enter agent's full name"
                        : field === "email"
                          ? "agent@example.com"
                          : "+250 7XX XXX XXX"}
                    />
                    {errors[field]?.map(error => (
                      <small className={styles.error}
                        key={error}>{error}</small>
                    ))}
                  </label>
                ))}

                <div className={styles.information}>
                  <strong>✉ Password setup by email</strong>
                  <p>
                    The agent will receive a secure link
                    to set their own password. The link
                    expires after 24 hours.
                  </p>
                </div>

                <div className={styles.actions}>
                  <button className={styles.secondary}
                    type="button" onClick={close}
                    disabled={busy}>
                    Cancel
                  </button>
                  <button className={styles.primary}
                    type="submit"
                    disabled={busy || uncertain}>
                    {busy ? "Sending..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
