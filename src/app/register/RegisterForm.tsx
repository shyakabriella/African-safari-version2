"use client";

import Link from "next/link";
import {
  useState,
  type FormEvent,
} from "react";

import styles from "./Register.module.css";

type AccountRole = "customer" | "vendor";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

type FieldErrors = Record<string, string[]>;

const initialValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
};

export default function RegisterForm({
  initialRole = "customer",
}: {
  initialRole?: AccountRole;
}) {
  const [values, setValues] = useState(initialValues);
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function update(field: keyof FormValues, value: string) {
    setValues(current => ({
      ...current,
      [field]: value,
    }));

    setErrors(current => {
      const next = { ...current };
      delete next[field];
      return next;
    });

    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || success) return;

    setMessage("");
    setErrors({});

    if (values.password !== values.password_confirmation) {
      setErrors({
        password_confirmation: ["The passwords do not match."],
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...values,
          role,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });

      const result = await response.json().catch(() => null);

      if (
        response.ok &&
        result?.success === true
      ) {
        setValues(initialValues);
        setSuccess(true);
        return;
      }

      if (
        result?.errors &&
        typeof result.errors === "object"
      ) {
        setErrors(result.errors);
      }

      setMessage(
        typeof result?.message === "string"
          ? result.message
          : "Unable to create your account."
      );

    } catch {
      setMessage(
        "Connection problem. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const formFields: {
    key: keyof FormValues;
    label: string;
    type: string;
    placeholder: string;
    autoComplete: string;
    maxLength: number;
  }[] = [
    {
      key: "name",
      label: "Full name",
      type: "text",
      placeholder: "Enter your full name",
      autoComplete: "name",
      maxLength: 120,
    },
    {
      key: "email",
      label: "Email address",
      type: "email",
      placeholder: "Enter your email address",
      autoComplete: "email",
      maxLength: 190,
    },
    {
      key: "phone",
      label: "Phone number",
      type: "tel",
      placeholder: "+250 788 000 000",
      autoComplete: "tel",
      maxLength: 40,
    },
    {
      key: "password",
      label: "Password",
      type: visible ? "text" : "password",
      placeholder: "At least 12 characters",
      autoComplete: "new-password",
      maxLength: 72,
    },
    {
      key: "password_confirmation",
      label: "Confirm password",
      type: visible ? "text" : "password",
      placeholder: "Repeat your password",
      autoComplete: "new-password",
      maxLength: 72,
    },
  ];

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
              START YOUR JOURNEY
            </span>

            <h1>Welcome to your adventure!</h1>

            <p>
              Discover unforgettable African safaris,
              beautiful destinations and exceptional stays.
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

            {success ? (
              <div className={styles.success}>

                <div className={styles.successIcon}>✓</div>

                <h2>Account created!</h2>

                <p>
                  Your account has been created successfully.
                  Sign in to continue your journey.
                </p>

                <Link
                  href="/login"
                  className={styles.submit}
                >
                  Continue to Sign In
                </Link>

              </div>
            ) : (
              <>
                <span className={styles.formEyebrow}>
                  YOUR AFRICAN ADVENTURE
                </span>

                <h2>
                  {role === "vendor"
                    ? "Register Your Safari Business"
                    : "Create Account"}
                </h2>

                <p className={styles.description}>
                  {role === "vendor"
                    ? "Create a business account to begin your safari operator registration."
                    : "Choose your account type and join us."}
                </p>

                <form
                  className={styles.form}
                  onSubmit={submit}
                >

                  <fieldset
                    className={styles.roleFieldset}
                    disabled={loading}
                  >
                    <legend>Account type</legend>

                    <div className={styles.roleOptions}>

                      <label
                        className={
                          role === "customer"
                            ? styles.selectedRole
                            : styles.roleOption
                        }
                      >
                        <input
                          type="radio"
                          name="role"
                          value="customer"
                          checked={role === "customer"}
                          onChange={() => setRole("customer")}
                        />

                        <strong>Traveler</strong>
                        <small>Explore and book trips</small>
                      </label>

                      <label
                        className={
                          role === "vendor"
                            ? styles.selectedRole
                            : styles.roleOption
                        }
                      >
                        <input
                          type="radio"
                          name="role"
                          value="vendor"
                          checked={role === "vendor"}
                          onChange={() => setRole("vendor")}
                        />

                        <strong>Business</strong>
                        <small>Offer travel services</small>
                      </label>

                    </div>

                    {errors.role?.map((error, index) => (
                      <span
                        className={styles.fieldError}
                        key={index}
                      >
                        {error}
                      </span>
                    ))}

                  </fieldset>

                  {role === "vendor" && (
                    <p className={styles.vendorNotice}>
                      First, create your business account.
                      After signing in, complete your company
                      profile and verification before publishing
                      safari tours.
                    </p>
                  )}

                  {formFields.map(field => (
                    <label
                      className={styles.label}
                      key={field.key}
                    >
                      {field.label}

                      <span
                        className={`${styles.inputWrap} ${
                          errors[field.key]
                            ? styles.invalidInput
                            : ""
                        }`}
                      >
                        <input
                          type={field.type}
                          name={field.key}
                          value={values[field.key]}
                          placeholder={field.placeholder}
                          autoComplete={field.autoComplete}
                          maxLength={field.maxLength}
                          minLength={
                            field.key.startsWith("password")
                              ? 12
                              : undefined
                          }
                          required
                          disabled={loading}
                          aria-invalid={
                            Boolean(errors[field.key])
                          }
                          aria-describedby={
                            errors[field.key]
                              ? `${field.key}-error`
                              : undefined
                          }
                          onChange={event =>
                            update(
                              field.key,
                              event.target.value
                            )
                          }
                        />
                      </span>

                      {errors[field.key] && (
                        <span
                          id={`${field.key}-error`}
                          className={styles.fieldError}
                        >
                          {errors[field.key].join(" ")}
                        </span>
                      )}

                    </label>
                  ))}

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
                    Use at least 12 characters.
                    Choose a unique, strong password.
                  </p>

                  {message && (
                    <p
                      className={styles.message}
                      role="alert"
                    >
                      {message}
                    </p>
                  )}

                  <button
                    type="submit"
                    className={styles.submit}
                    disabled={loading}
                  >
                    {loading
                      ? "Creating account..."
                      : "Create Account"}
                  </button>

                  <p className={styles.signInNote}>
                    Already have an account?{" "}
                    <Link href="/login">Sign In</Link>
                  </p>

                  <p className={styles.security}>
                    Secure access to your account
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
