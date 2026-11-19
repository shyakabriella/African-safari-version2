"use client";

import Link from "next/link";

import {
  useState,
  type FormEvent,
} from "react";

import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/auth/profile";

import styles from "./Profile.module.css";

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function ProfileForm({
  initialProfile,
}: {
  initialProfile: UserProfile;
}) {
  const router = useRouter();

  const [profile, setProfile] =
    useState(initialProfile);

  const [name, setName] =
    useState(initialProfile.name);

  const [phone, setPhone] =
    useState(initialProfile.phone ?? "");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] =
    useState<Record<string, string[]>>({});

  const changed =
    name.trim() !== profile.name ||
    phone.trim() !== (profile.phone ?? "");

  const avatar = profile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join("") || "U";

  function cancel() {
    setName(profile.name);
    setPhone(profile.phone ?? "");
    setMessage("");
    setErrors({});
    setSuccess(false);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!changed || loading) return;

    setMessage("");
    setErrors({});
    setSuccess(false);

    const data: Record<string, string> = {};

    if (name.trim() !== profile.name) {
      data.name = name.trim();
    }

    if (phone.trim() !== (profile.phone ?? "")) {
      data.phone = phone.trim();
    }

    if ("phone" in data && !data.phone) {
      setErrors({
        phone: ["Phone number cannot be removed."],
      });

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/profile",
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
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
        result?.success === true &&
        result.data
      ) {
        setProfile(result.data);
        setName(result.data.name);
        setPhone(result.data.phone ?? "");
        setSuccess(true);
        setMessage("Profile updated successfully.");
        router.refresh();

        return;
      }

      if (result?.errors) {
        setErrors(result.errors);
      }

      setMessage(
        typeof result?.message === "string"
          ? result.message
          : "Unable to update profile."
      );

    } catch {
      setMessage("Connection problem. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      <header className={styles.heading}>
        <span>ACCOUNT MANAGEMENT</span>
        <h1>My Profile</h1>
        <p>Manage your personal information.</p>
      </header>

      <div className={styles.grid}>

        <aside className={styles.card}>

          <div className={styles.identity}>

            <div className={styles.avatar}>
              {avatar}
            </div>

            <h2>{profile.name}</h2>
            <p>{profile.email}</p>

            <span className={styles.role}>
              {profile.role}
            </span>

          </div>

          <dl className={styles.details}>

            <div>
              <dt>Account ID</dt>
              <dd>#{profile.id}</dd>
            </div>

            <div>
              <dt>Account status</dt>
              <dd className={styles.active}>
                {profile.is_active ? "Active" : "Inactive"}
              </dd>
            </div>

            <div>
              <dt>Member since</dt>
              <dd>{formatDate(profile.created_at)}</dd>
            </div>

            <div>
              <dt>Last updated</dt>
              <dd>{formatDate(profile.updated_at)}</dd>
            </div>

          </dl>

        </aside>

        <section className={styles.card}>

          <div className={styles.cardHeading}>
            <h2>Personal Information</h2>
            <p>Keep your account details up to date.</p>
          </div>

          <form
            className={styles.form}
            onSubmit={submit}
          >

            <label className={styles.field}>
              Full name

              <input
                name="name"
                value={name}
                autoComplete="name"
                maxLength={120}
                required
                disabled={loading}
                onChange={event =>
                  setName(event.target.value)}
              />

              {errors.name && (
                <small className={styles.error}>
                  {errors.name.join(" ")}
                </small>
              )}
            </label>

            <label className={styles.field}>
              Email address

              <input
                type="email"
                value={profile.email}
                readOnly
              />

              <small>Email changes are not supported yet.</small>
            </label>

            <label className={styles.field}>
              Phone number

              <input
                name="phone"
                type="tel"
                value={phone}
                placeholder="+250 788 000 000"
                autoComplete="tel"
                maxLength={40}
                disabled={loading}
                onChange={event =>
                  setPhone(event.target.value)}
              />

              {errors.phone && (
                <small className={styles.error}>
                  {errors.phone.join(" ")}
                </small>
              )}
            </label>

            <label className={styles.field}>
              Account role

              <input
                value={profile.role}
                readOnly
              />

              <small>
                Account roles are managed by the platform.
              </small>
            </label>

            {message && (
              <p
                role={success ? "status" : "alert"}
                className={
                  success
                    ? styles.successMessage
                    : styles.errorMessage
                }
              >
                {message}
              </p>
            )}

            <div className={styles.actions}>

              <button
                type="button"
                className={styles.cancel}
                disabled={loading || !changed}
                onClick={cancel}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={styles.save}
                disabled={loading || !changed}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>

            </div>

          </form>

        </section>

      </div>

      <section className={styles.card}>

        <div className={styles.cardHeading}>
          <h2>Account Security</h2>
          <p>Manage your password and active sessions.</p>
        </div>

        <div className={styles.securityRows}>

          <div>
            <span>
              <strong>Change Password</strong>
              <small>Update your account password.</small>
            </span>

            <Link
              href="/dashboard/profile/change-password"
              className={styles.securityLink}
            >
              Change Password
            </Link>
          </div>

          <div>
            <span>
              <strong>Active Sessions</strong>
              <small>Manage sessions or sign out everywhere.</small>
            </span>

            <Link
              href="/dashboard/profile/sessions"
              className={styles.securityLink}
            >
              Manage Sessions
            </Link>
          </div>

        </div>

      </section>

    </div>
  );
}
