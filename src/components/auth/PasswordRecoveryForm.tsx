"use client";

import Link from "next/link";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import styles from "@/app/register/Register.module.css";

type RecoveryMode = "forgot" | "reset";

type Props = {
  mode: RecoveryMode;
};

export default function PasswordRecoveryForm({
  mode,
}: Props) {
  const isReset = mode === "reset";

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const recoveryRef = useRef<{
    email: string;
    token: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(!isReset);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isReset) return;

    if (!recoveryRef.current) {
      const url = new URL(window.location.href);

      recoveryRef.current = {
        email: (
          url.searchParams.get("email") || ""
        ).trim().toLowerCase(),
        token: (
          url.searchParams.get("token") || ""
        ).trim(),
      };

      // Remove recovery credentials from the visible URL.
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }

    let active = true;

    queueMicrotask(() => {
      if (!active || !recoveryRef.current) return;

      setEmail(recoveryRef.current.email);
      setToken(recoveryRef.current.token);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [isReset]);

  const invalidLink = isReset && (
    !token ||
    token.length > 512 ||
    !email ||
    email.length > 190 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || success || invalidLink || !ready) {
      return;
    }

    setMessage("");

    if (isReset) {
      if (
        password.length < 12 ||
        new TextEncoder().encode(password).length > 72
      ) {
        setMessage(
          "Use at least 12 characters and no more than 72 bytes."
        );

        return;
      }

      if (password !== confirmation) {
        setMessage("The passwords do not match.");
        return;
      }
    }

    setLoading(true);

    const endpoint = isReset
      ? "/api/auth/reset-password"
      : "/api/auth/forgot-password";

    const payload = isReset
      ? {
          email: email.trim().toLowerCase(),
          token,
          password,
          password_confirmation: confirmation,
        }
      : {
          email: email.trim().toLowerCase(),
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success === true) {
        setPassword("");
        setConfirmation("");
        setToken("");

        setSuccess(true);
        return;
      }

      setMessage(
        typeof result?.message === "string"
          ? result.message
          : "Unable to complete your request."
      );

    } catch {
      setMessage(
        "Connection problem. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>

      <Link href="/" className={styles.back}>
        <span aria-hidden="true">←</span>
        Back to home
      </Link>

      <div className={styles.card}>

        <section className={styles.welcome}>

          <Link href="/" className={styles.logo}>
            <img
              src="/images/logo/LOGO.png"
              alt="African Safaris and Hotel Booking Hub"
            />
          </Link>

          <div className={styles.decorationOne} />
          <div className={styles.decorationTwo} />

          <div className={styles.welcomeContent}>

            <span className={styles.eyebrow}>
              SECURE ACCOUNT ACCESS
            </span>

            <h1>Your journey continues.</h1>

            <p>
              Recover your account and return to
              exploring Africa with confidence.
            </p>

            <Link
              href="/login"
              className={styles.outlineButton}
            >
              Sign In
            </Link>

          </div>

          <span className={styles.brandNote}>
            AFRICAN SAFARIS &amp; HOTEL BOOKING HUB
          </span>

        </section>

        <section className={styles.formPanel}>
          <div className={styles.formContent}>

            <div className={styles.mobileLogo}>
              <Link href="/">
                <img
                  src="/images/logo/LOGO.png"
                  alt="African Safaris"
                />
              </Link>
            </div>

            <span className={styles.formEyebrow}>
              ACCOUNT SECURITY
            </span>

            {!ready ? (
              <div role="status">
                <h2>Checking reset link...</h2>
              </div>
            ) : success ? (
              <div className={styles.success}>

                <div className={styles.successIcon}>
                  ✓
                </div>

                <h2>
                  {isReset
                    ? "Password updated!"
                    : "Check your email"}
                </h2>

                <p role="status">
                  {isReset
                    ? "Your password has been changed. Sign in with your new password."
                    : "If your account exists, password reset instructions will be sent to your email. Please also check your spam folder."}
                </p>

                <Link
                  href="/login"
                  className={styles.submit}
                >
                  Return to Sign In
                </Link>

                {!isReset && (
                  <p className={styles.passwordNote}>
                    Reset links expire after 60 minutes.
                  </p>
                )}

              </div>
            ) : invalidLink ? (
              <div className={styles.success}>

                <h2>Invalid reset link</h2>

                <p>
                  Your reset link is incomplete or invalid.
                  Please request a new password reset link.
                </p>

                <Link
                  href="/forgot-password"
                  className={styles.submit}
                >
                  Request New Link
                </Link>

              </div>
            ) : (
              <>
                <h2>
                  {isReset
                    ? "Reset Password"
                    : "Forgot Password?"}
                </h2>

                <p className={styles.description}>
                  {isReset
                    ? "Choose a new secure password for your account."
                    : "Enter your email address to request password recovery instructions."}
                </p>

                <form
                  className={styles.form}
                  onSubmit={submit}
                >

                  <label className={styles.label}>
                    Email address

                    <span className={styles.inputWrap}>
                      <input
                        type="email"
                        value={email}
                        name="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        required
                        readOnly={isReset}
                        disabled={loading}
                        maxLength={190}
                        onChange={event =>
                          setEmail(event.target.value)
                        }
                      />
                    </span>
                  </label>

                  {isReset && (
                    <>
                      <label className={styles.label}>
                        New password

                        <span className={styles.inputWrap}>
                          <input
                            type={
                              visible ? "text" : "password"
                            }
                            name="password"
                            value={password}
                            autoComplete="new-password"
                            placeholder="At least 12 characters"
                            minLength={12}
                            maxLength={72}
                            required
                            disabled={loading}
                            onChange={event =>
                              setPassword(event.target.value)
                            }
                          />
                        </span>
                      </label>

                      <label className={styles.label}>
                        Confirm new password

                        <span className={styles.inputWrap}>
                          <input
                            type={
                              visible ? "text" : "password"
                            }
                            name="password_confirmation"
                            value={confirmation}
                            autoComplete="new-password"
                            placeholder="Repeat your new password"
                            minLength={12}
                            maxLength={72}
                            required
                            disabled={loading}
                            onChange={event =>
                              setConfirmation(
                                event.target.value
                              )
                            }
                          />
                        </span>
                      </label>

                      <label className={styles.showPassword}>
                        <input
                          type="checkbox"
                          checked={visible}
                          disabled={loading}
                          onChange={event =>
                            setVisible(event.target.checked)
                          }
                        />
                        Show passwords
                      </label>

                      <p className={styles.passwordNote}>
                        Choose a unique password.
                        Existing sessions will be signed out
                        after your password is reset.
                      </p>

                    </>
                  )}

                  {message && (
                    <p
                      role="alert"
                      className={styles.message}
                    >
                      {message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.submit}
                  >
                    {loading
                      ? "Please wait..."
                      : isReset
                        ? "Reset Password"
                        : "Send Reset Link"}
                  </button>

                  {isReset && (
                    <p className={styles.signInNote}>
                      Link expired?{" "}
                      <Link href="/forgot-password">
                        Request another link
                      </Link>
                    </p>
                  )}

                  <p className={styles.signInNote}>
                    <Link href="/login">
                      Back to Sign In
                    </Link>
                  </p>

                  <p className={styles.security}>
                    Secure account recovery
                  </p>

                </form>
              </>
            )}

          </div>
        </section>
      </div>

      <p className={styles.footer}>
        African Safaris &amp; Hotel Booking Hub
      </p>

    </main>
  );
}
