import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { reply, sameOrigin } from "@/lib/auth/server";

const API = "https://api.hotelandsafari.com/api";
const MAX_BYTES = 8192;

function validText(value: unknown, maximum: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    Array.from(value.trim()).length <= maximum &&
    !/[\u0000-\u001f\u007f]/.test(value) &&
    !/[\uD800-\uDFFF]/u.test(value)
  );
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      success: false,
      message: "Request not allowed.",
    }, 403);
  }

  if (request.nextUrl.search) {
    return reply({
      success: false,
      message: "Unexpected query parameters.",
    }, 422);
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return reply({
      success: false,
      message: "JSON is required.",
    }, 415);
  }

  const declaredLength = Number(
    request.headers.get("content-length") ?? 0
  );

  if (
    !Number.isFinite(declaredLength) ||
    declaredLength < 0 ||
    declaredLength > MAX_BYTES
  ) {
    return reply({
      success: false,
      message: "Request is too large.",
    }, 413);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("afhbh_session")?.value;

  if (!token) {
    return reply({
      success: false,
      message: "Please sign in again.",
    }, 401);
  }

  let body: unknown;

  try {
    const raw = await request.text();

    if (new TextEncoder().encode(raw).length > MAX_BYTES) {
      return reply({
        success: false,
        message: "Request is too large.",
      }, 413);
    }

    body = JSON.parse(raw);
  } catch {
    return reply({
      success: false,
      message: "Invalid JSON request.",
    }, 422);
  }

  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return reply({
      success: false,
      message: "Invalid agent details.",
    }, 422);
  }

  const input = body as Record<string, unknown>;

  if (
    Object.keys(input).some(
      key => !["name", "email", "phone"].includes(key)
    ) ||
    !validText(input.name, 120) ||
    !validText(input.email, 190) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) ||
    !(
      input.phone === null ||
      input.phone === undefined ||
      input.phone === "" ||
      validText(input.phone, 40)
    )
  ) {
    return reply({
      success: false,
      message: "Invalid agent details.",
    }, 422);
  }

  const payload = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: typeof input.phone === "string"
      ? input.phone.trim() || null
      : null,
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Check current role and account status on the
  // backend before attempting invitation creation.
  let profile: Response;

  try {
    profile = await fetch(`${API}/me`, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return reply({
      success: false,
      message: "Unable to verify administrator access.",
    }, 503);
  }

  if (profile.status === 401) {
    return reply({
      success: false,
      message: "Please sign in again.",
    }, 401);
  }

  if (!profile.ok) {
    return reply({
      success: false,
      message: "Unable to verify administrator access.",
    }, 503);
  }

  const account = await profile.json().catch(() => null);
  const user = account?.data?.user ?? account?.data;

  if (
    account?.success !== true ||
    user?.role !== "admin" ||
    user?.is_active !== true
  ) {
    return reply({
      success: false,
      message: "Administrator access required.",
    }, 403);
  }

  let response: Response;

  try {
    response = await fetch(
      `${API}/admin/agents/invitations`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      }
    );
  } catch {
    return reply({
      success: false,
      message:
        "Invitation status is uncertain. Check the Users Directory before retrying.",
      outcome_uncertain: true,
    }, 503);
  }

  const result = await response.json().catch(() => null);

  if (
    response.status === 201 &&
    result?.success === true &&
    result?.invitation_status === "pending" &&
    result?.data?.role === "agent" &&
    result?.data?.email === payload.email &&
    Number.isSafeInteger(result?.data?.id) &&
    result.data.id > 0
  ) {
    return reply({
      success: true,
      message: "Agent invitation sent.",
      data: {
        id: result.data.id,
        email: result.data.email,
        role: "agent",
      },
    }, 201);
  }

  if (response.status === 422) {
    const safeErrors: Record<string, string[]> = {};

    for (const field of ["name", "email", "phone"]) {
      const messages = result?.errors?.[field];

      if (Array.isArray(messages)) {
        safeErrors[field] = messages
          .filter((message): message is string =>
            typeof message === "string"
          )
          .slice(0, 2)
          .map(message => message.slice(0, 150));
      }
    }

    return reply({
      success: false,
      message: "Please review the agent details.",
      errors: safeErrors,
    }, 422);
  }

  if (response.status === 401 || response.status === 403) {
    return reply({
      success: false,
      message: response.status === 401
        ? "Please sign in again."
        : "Administrator access required.",
    }, response.status);
  }

  if (response.status === 429) {
    return reply({
      success: false,
      message: "Too many requests. Please try again later.",
    }, 429);
  }

  return reply({
    success: false,
    message:
      "Invitation status could not be confirmed. Check the Users Directory.",
    outcome_uncertain: true,
  }, 503);
}
