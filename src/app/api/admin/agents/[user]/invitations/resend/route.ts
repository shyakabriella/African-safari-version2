import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { reply, sameOrigin } from "@/lib/auth/server";

const API = "https://api.hotelandsafari.com/api";

type Context = {
  params: Promise<{ user: string }>;
};

export async function POST(
  request: NextRequest,
  context: Context
) {
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

  const { user } = await context.params;

  if (
    !/^[1-9]\d{0,14}$/.test(user) ||
    !Number.isSafeInteger(Number(user))
  ) {
    return reply({
      success: false,
      message: "Invalid agent account.",
    }, 422);
  }

  if (
    request.headers.get("content-encoding") &&
    request.headers.get("content-encoding") !== "identity"
  ) {
    return reply({
      success: false,
      message: "Unsupported request encoding.",
    }, 415);
  }

  const body = await request.text().catch(() => null);

  if (body !== "") {
    return reply({
      success: false,
      message: "This request must not contain account details.",
    }, 422);
  }

  const store = await cookies();
  const token = store.get("afhbh_session")?.value;

  if (!token) {
    return reply({
      success: false,
      message: "Please sign in again.",
    }, 401);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  try {
    // Verify the current session before making
    // this sensitive administrative request.
    const profile = await fetch(`${API}/me`, {
      method: "GET",
      headers,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });

    if (profile.status === 401) {
      return reply({
        success: false,
        message: "Please sign in again.",
      }, 401);
    }

    if (!profile.ok) {
      return reply({
        success: false,
        message: "Account verification unavailable.",
      }, 503);
    }

    const account = await profile.json().catch(() => null);
    const actor = account?.data?.user ?? account?.data;

    if (
      account?.success !== true ||
      actor?.role !== "admin" ||
      actor?.is_active !== true
    ) {
      return reply({
        success: false,
        message: "Administrator access required.",
      }, 403);
    }

    // Never automatically retry this POST.
    const response = await fetch(
      `${API}/admin/agents/${user}/invitations/resend`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(20000),
      }
    );

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
        message: "Too many requests. Try again later.",
      }, 429);
    }

    if (response.status === 422) {
      return reply({
        success: false,
        message:
          "This account is not eligible for invitation resend. It may already be active, have a valid invitation, or require administrator review.",
      }, 422);
    }

    const result = await response.json().catch(() => null);

    if (
      response.status === 200 &&
      result?.success === true &&
      result?.data?.id === Number(user) &&
      result?.data?.invitation_status === "pending"
    ) {
      return reply({
        success: true,
        message: "A new invitation email has been sent.",
      }, 200);
    }

    return reply({
      success: false,
      message:
        "Invitation delivery could not be confirmed. Check the agent account before retrying.",
      outcome_uncertain: true,
    }, 503);

  } catch {
    return reply({
      success: false,
      message:
        "Connection interrupted. Check the agent account before retrying.",
      outcome_uncertain: true,
    }, 503);
  }
}
