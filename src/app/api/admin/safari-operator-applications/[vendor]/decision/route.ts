import type { NextRequest } from "next/server";

import { reply, sameOrigin } from "@/lib/auth/server";
import { forwardOperatorApproval } from
  "@/lib/admin/operator-approvals";

type Context = {
  params: Promise<{ vendor: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: Context,
) {
  if (!sameOrigin(request)) {
    return reply({
      success: false,
      message: "Request origin not allowed.",
    }, 403);
  }

  const { vendor } = await context.params;

  if (!/^[1-9]\d{0,14}$/.test(vendor)) {
    return reply({
      success: false,
      message: "Invalid Safari Operator ID.",
    }, 422);
  }

  const contentLength = request.headers.get("content-length");

  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) ||
      Number(contentLength) > 4096)
  ) {
    return reply({
      success: false,
      message: "Invalid request size.",
    }, 413);
  }

  const raw = await request.text();

  if (raw.length > 4096) {
    return reply({
      success: false,
      message: "Request is too large.",
    }, 413);
  }

  let payload: unknown;

  try {
    payload = JSON.parse(raw);
  } catch {
    return reply({
      success: false,
      message: "Invalid request body.",
    }, 422);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return reply({
      success: false,
      message: "Invalid decision data.",
    }, 422);
  }

  const data = payload as Record<string, unknown>;

  if (
    Object.keys(data).some(
      key => !["decision", "reason"].includes(key)
    ) ||
    !["approved", "rejected"].includes(
      String(data.decision)
    ) ||
    (data.reason !== undefined &&
      typeof data.reason !== "string")
  ) {
    return reply({
      success: false,
      message: "Invalid decision data.",
    }, 422);
  }

  const decision = data.decision as string;
  const reason = typeof data.reason === "string"
    ? data.reason.trim()
    : "";

  if (
    reason.length > 1000 ||
    (decision === "rejected" && !reason)
  ) {
    return reply({
      success: false,
      message: "A valid rejection reason is required.",
    }, 422);
  }

  return forwardOperatorApproval(
    `/${vendor}/decision`,
    "PATCH",
    {
      decision,
      ...(reason ? { reason } : {}),
    },
  );
}
