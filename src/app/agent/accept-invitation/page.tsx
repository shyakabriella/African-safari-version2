"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

export default function AcceptInvitationPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  const invitationRef = useRef<{
    email: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    if (!invitationRef.current) {
      const params = new URLSearchParams(window.location.search);

      invitationRef.current = {
        email: params.get("email") ?? "",
        token: params.get("token") ?? "",
      };

      // Remove the secret token from browser history.
      window.history.replaceState(
        null,
        "",
        window.location.pathname,
      );
    }

    let active = true;

    queueMicrotask(() => {
      if (!active || !invitationRef.current) return;

      setEmail(invitationRef.current.email);
      setToken(invitationRef.current.token);
    });

    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || done) return;

    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/agent/invitations/accept",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            token,
            password,
            password_confirmation: confirmation,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success === true) {
        setDone(true);
        setMessage("Your account is active. You can now sign in.");
      } else {
        setMessage(result?.message || "Unable to activate account.");
      }
    } catch {
      setMessage("Connection failed. Please try again.");
    } finally {
      setPassword("");
      setConfirmation("");
      setBusy(false);
    }
  }

  return (
    <main style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: 20,
      background: "#f4f7f5",
      color: "#173c36",
    }}>
      <section style={{
        maxWidth: 460,
        width: "100%",
        background: "white",
        border: "1px solid #e2e8e4",
        borderRadius: 12,
        padding: 28,
      }}>
        <h1 style={{ fontSize: 25, fontWeight: 800 }}>
          Set Your Agent Password
        </h1>
        <p style={{ marginTop: 10, fontSize: 13 }}>
          Welcome to African Safaris. Set your own password
          to activate your agent account.
        </p>

        {message && (
          <p role="status" style={{ marginTop: 18, fontSize: 13 }}>
            {message}
          </p>
        )}

        {done ? (
          <Link href="/login"
            style={{ display: "block", marginTop: 22 }}>
            Continue to Sign In
          </Link>
        ) : (
          <form onSubmit={submit}
            style={{ display: "grid", gap: 15, marginTop: 22 }}>
            <label style={{ display: "grid", gap: 6 }}>
              Email
              <input value={email} readOnly required
                style={{ padding: 12, border: "1px solid #ddd" }} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              New Password
              <input type="password" value={password}
                autoComplete="new-password" required minLength={12}
                onChange={event => setPassword(event.target.value)}
                style={{ padding: 12, border: "1px solid #ddd" }} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              Confirm Password
              <input type="password" value={confirmation}
                autoComplete="new-password" required minLength={12}
                onChange={event => setConfirmation(event.target.value)}
                style={{ padding: 12, border: "1px solid #ddd" }} />
            </label>
            <button disabled={busy || !token}
              style={{
                padding: 13,
                border: 0,
                borderRadius: 6,
                background: "#173c36",
                color: "white",
                cursor: "pointer",
              }}>
              {busy ? "Activating..." : "Set Password & Activate"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
