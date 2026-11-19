"use client";

import Link from "next/link";

import {
  useState,
  type FormEvent,
} from "react";

import styles from "./ChangePassword.module.css";

export default function ChangePasswordForm({
  profileHref = "/dashboard/profile",
}: {
  profileHref?: string;
}) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const longEnough =
    Array.from(password).length >= 12;

  const validSize =
    password.length > 0 &&
    new TextEncoder().encode(password).length <= 72;

  const different =
    password.length > 0 && password !== current;

  const matching =
    password.length > 0 &&
    password === confirmation;

  const ready =
    current.length > 0 &&
    longEnough &&
    validSize &&
    different &&
    matching &&
    confirmed;

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!ready || loading || success) return;

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: current,
            password,
            password_confirmation: confirmation,
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(30000),
        }
      );

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const result = await response.json()
        .catch(() => null);

      if (
        response.ok &&
        result?.success === true
      ) {
        setCurrent("");
        setPassword("");
        setConfirmation("");
        setSuccess(true);

        window.location.replace("/login");

        return;
      }

      setMessage(
        typeof result?.message === "string"
          ? result.message
          : "Unable to change your password."
      );

    } catch {
      setMessage(
        "Unable to confirm the password change. Check your connection."
      );
    } finally {
      setLoading(false);
    }
  }

  const requirements = [
    {
      label: "At least 12 characters",
      valid: longEnough,
    },
    {
      label: "No more than 72 bytes",
      valid: validSize,
    },
    {
      label: "Different from current password",
      valid: different,
    },
    {
      label: "New passwords match",
      valid: matching,
    },
  ];

  return (
    <div className={styles.page}>

      <Link
        href={profileHref}
        className={styles.back}
      >
        ← Back to My Profile
      </Link>

      <header className={styles.heading}>
        <span>ACCOUNT SECURITY</span>

        <h1>Change Password</h1>

        <p>
          Protect your account with a new secure password.
        </p>
      </header>

      <div className={styles.grid}>

        <section className={styles.card}>

          <div className={styles.cardHeading}>
            <h2>Password Information</h2>
            <p>
              Verify your current password before
              choosing a new one.
            </p>
          </div>

          <form
            className={styles.form}
            onSubmit={submit}
          >

            <label className={styles.field}>
              Current password

              <input
                type={visible ? "text" : "password"}
                name="current_password"
                value={current}
                autoComplete="current-password"
                placeholder="Enter current password"
                maxLength={1024}
                required
                disabled={loading}
                onChange={event =>
                  setCurrent(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              New password

              <input
                type={visible ? "text" : "password"}
                name="password"
                value={password}
                autoComplete="new-password"
                placeholder="Enter new password"
                maxLength={72}
                required
                disabled={loading}
                onChange={event =>
                  setPassword(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              Confirm new password

              <input
                type={visible ? "text" : "password"}
                name="password_confirmation"
                value={confirmation}
                autoComplete="new-password"
                placeholder="Repeat new password"
                maxLength={72}
                required
                disabled={loading}
                onChange={event =>
                  setConfirmation(event.target.value)}
              />
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={visible}
                disabled={loading}
                onChange={event =>
                  setVisible(event.target.checked)}
              />

              Show passwords
            </label>

            <div className={styles.warning}>
              <strong>All sessions will be signed out.</strong>

              <p>
                Changing your password will sign you
                out of this device and all other devices.
                You must sign in again.
              </p>
            </div>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={confirmed}
                disabled={loading}
                required
                onChange={event =>
                  setConfirmed(event.target.checked)}
              />

              I understand that all my sessions will
              be signed out.
            </label>

            {message && (
              <p
                role="alert"
                className={styles.error}
              >
                {message}
              </p>
            )}

            <div className={styles.actions}>

              <Link
                href={profileHref}
                className={styles.cancel}
              >
                Cancel
              </Link>

              <button
                type="submit"
                className={styles.save}
                disabled={!ready || loading || success}
              >
                {success
                  ? "Password changed"
                  : loading
                    ? "Changing password..."
                    : "Change Password"}
              </button>

            </div>

          </form>

        </section>

        <aside className={styles.card}>

          <div className={styles.cardHeading}>
            <h2>Password Requirements</h2>

            <p>
              Your password must meet these requirements.
            </p>
          </div>

          <div className={styles.requirements}>

            {requirements.map(item => (
              <div key={item.label}>

                <span
                  className={
                    item.valid
                      ? styles.valid
                      : styles.invalid
                  }
                  aria-label={
                    item.valid
                      ? "Requirement met"
                      : "Requirement not met"
                  }
                >
                  {item.valid ? "✓" : "○"}
                </span>

                {item.label}

              </div>
            ))}

          </div>

          <div className={styles.advice}>
            <strong>Security tip</strong>

            <p>
              Use a unique password that you do not use
              for another website or service.
            </p>
          </div>

          <div className={styles.recovery}>

            <p>Forgot your current password?</p>

            <Link href="/forgot-password">
              Recover your password
            </Link>

          </div>

        </aside>

      </div>

    </div>
  );
}
