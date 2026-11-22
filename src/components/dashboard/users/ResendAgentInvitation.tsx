"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: number;
};

export default function ResendAgentInvitation({
  userId,
}: Props) {
  const router = useRouter();

  const locked = useRef(false);

  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  async function resend() {
    if (locked.current || sent || uncertain) return;

    locked.current = true;
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/agents/${userId}/invitations/resend`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success === true) {
        setSent(true);
        setMessage(
          "A fresh invitation email has been sent. The previous link is no longer valid."
        );
        router.refresh();
        return;
      }

      const statusUncertain =
        result?.outcome_uncertain === true ||
        response.status >= 500;

      setUncertain(statusUncertain);

      setMessage(
        statusUncertain
          ? "Delivery could not be confirmed. Check the account before retrying."
          : typeof result?.message === "string"
            ? result.message
            : "Unable to resend the invitation."
      );
    } catch {
      setUncertain(true);
      setMessage(
        "Connection interrupted. Check the account before retrying."
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <section
      style={{
        padding: 20,
        marginTop: 20,
        border: "1px solid #dfe7e1",
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <h2 style={{ fontSize: 17, fontWeight: 800 }}>
        Agent Invitation
      </h2>

      <p style={{ marginTop: 8, fontSize: 13 }}>
        If this agent has not received their invitation
        or the invitation has expired, you can request
        a new email. Suspended accounts cannot be
        recovered through this action.
      </p>

      <button
        type="button"
        onClick={resend}
        disabled={busy || uncertain || sent}
        style={{
          marginTop: 16,
          padding: "12px 18px",
          background: "#173c36",
          border: 0,
          borderRadius: 6,
          color: "white",
          fontWeight: 700,
          cursor: busy || uncertain || sent
            ? "not-allowed"
            : "pointer",
          opacity: busy || uncertain || sent ? 0.6 : 1,
        }}
      >
        {busy
          ? "Sending invitation..."
          : sent
            ? "Invitation Sent"
            : "Resend Invitation"}
      </button>

      {message && (
        <p
          role="status"
          aria-live="polite"
          style={{ marginTop: 12, fontSize: 13 }}
        >
          {message}
        </p>
      )}
    </section>
  );
}
