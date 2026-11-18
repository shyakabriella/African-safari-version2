"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "./Login.module.css";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" aria-hidden="true">
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" aria-hidden="true">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {visible && <path d="M3 3 21 21" />}
    </svg>
  );
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState<
    "login" | "otp" | "success"
  >("login");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setLoading(true);

    try {
      const verifying = stage === "otp";

      const response = await fetch(
        verifying
          ? "/api/auth/verify-otp"
          : "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(
            verifying
              ? { email: email.trim(), otp }
              : { email: email.trim(), password }
          ),
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to sign in.");
        return;
      }

      if (data.success !== true) {
        setMessage("Unable to authenticate your account.");
        return;
      }

      if (verifying || data.requiresOtp === false) {
        setOtp("");
        setPassword("");
        window.location.replace("/dashboard");
      } else if (data.requiresOtp === true) {
        setPassword("");
        setStage("otp");
      } else {
        setMessage("Unexpected authentication response.");
      }
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        <span aria-hidden="true">←</span> Back to home
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
              DISCOVER AFRICA
            </span>

            <h1>Welcome Back!</h1>

            <p>
              Your next African adventure starts here.
              Sign in and continue your journey with us.
            </p>

            <button
              type="button"
              className={styles.outlineButton}
              onClick={() => window.location.assign("/register")}
              disabled={loading}
            >
              Create Account
            </button>
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

            {stage === "success" ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>✓</div>
                <h2>Welcome back!</h2>
                <p>You have successfully signed in.</p>
                <Link href="/" className={styles.submit}>
                  Explore Africa
                </Link>
              </div>
            ) : (
              <>
                <span className={styles.formEyebrow}>
                  YOUR AFRICAN ADVENTURE
                </span>

                <h2>
                  {stage === "login"
                    ? "Sign In"
                    : "Verify Your Account"}
                </h2>

                <p className={styles.description}>
                  {stage === "login"
                    ? "Welcome to your travel account."
                    : "Enter the verification code sent to your email."}
                </p>

                <form
                  className={styles.form}
                  onSubmit={submit}
                >
                  {stage === "login" ? (
                    <>
                      <label className={styles.label}>
                        Email address

                        <span className={styles.inputWrap}>
                          <MailIcon />

                          <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) =>
                              setEmail(e.target.value)}
                            required
                            disabled={loading}
                            maxLength={255}
                          />
                        </span>
                      </label>

                      <label className={styles.label}>
                        Password

                        <span className={styles.inputWrap}>
                          <LockIcon />

                          <input
                            type={visible ? "text" : "password"}
                            name="password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) =>
                              setPassword(e.target.value)}
                            required
                            disabled={loading}
                          />

                          <button
                            type="button"
                            className={styles.eye}
                            aria-label={
                              visible
                                ? "Hide password"
                                : "Show password"
                            }
                            onClick={() => setVisible(!visible)}
                          >
                            <EyeIcon visible={visible} />
                          </button>
                        </span>
                      </label>

                      <button
                        type="button"
                        className={styles.forgot}
                        disabled={loading}
                        onClick={() => setMessage(
                          "Password recovery will be available soon."
                        )}
                      >
                        Forgot password?
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.emailNotice}>
                        {email}
                      </div>

                      <label className={styles.label}>
                        Verification code

                        <span className={styles.inputWrap}>
                          <LockIcon />

                          <input
                            type="text"
                            name="otp"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="Enter verification code"
                            value={otp}
                            onChange={(e) =>
                              setOtp(
                                e.target.value.replace(/\D/g, "")
                              )
                            }
                            maxLength={6}
                            minLength={6}
                            required
                            disabled={loading}
                          />
                        </span>
                      </label>
                    </>
                  )}

                  {message && (
                    <p
                      className={styles.message}
                      role="status"
                      aria-live="polite"
                    >
                      {message}
                    </p>
                  )}

                  <button
                    className={styles.submit}
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? "Please wait..."
                      : stage === "login"
                        ? "Sign In"
                        : "Verify & Sign In"}
                  </button>

                  {stage === "otp" && (
                    <button
                      type="button"
                      className={styles.textButton}
                      disabled={loading}
                      onClick={() => {
                        setOtp("");
                        setMessage("");
                        setStage("login");
                      }}
                    >
                      Back to Sign In
                    </button>
                  )}

                  <p className={styles.security}>
                    <LockIcon /> Secure access to your account
                  </p>

                  <div className={styles.mobileRegister}>
                    New here?{" "}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => window.location.assign("/register")}
                    >
                      Create account
                    </button>
                  </div>
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
