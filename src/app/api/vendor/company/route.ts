import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { getAccountAccess } from "@/lib/auth/access";
import { reply, sameOrigin } from "@/lib/auth/server";

const API = "https://api.hotelandsafari.com/api/vendors";

type Company = {
  id: number;
  legal_name: string;
  display_name: string;
  type: string;
  status: string;
  tax_id: string | null;
  payout_method: string;
};

const statuses = [
  "pending", "approved", "rejected", "suspended",
];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function parseCompany(value: unknown): Company | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "number" ||
    !Number.isSafeInteger(value.id) ||
    value.id < 1 ||
    typeof value.legal_name !== "string" ||
    typeof value.display_name !== "string" ||
    typeof value.type !== "string" ||
    typeof value.status !== "string" ||
    !statuses.includes(value.status) ||
    !["bank", "mobile_money"].includes(
      String(value.payout_method)
    ) ||
    !(
      value.tax_id === null ||
      value.tax_id === undefined ||
      typeof value.tax_id === "string"
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    legal_name: value.legal_name,
    display_name: value.display_name,
    type: value.type,
    status: value.status,
    tax_id:
      typeof value.tax_id === "string"
        ? value.tax_id
        : null,
    payout_method: String(value.payout_method),
  };
}

async function vendorToken() {
  const access = await getAccountAccess();

  if (access.status === "unauthenticated") {
    return {
      status: 401,
      token: null,
    };
  }

  if (access.status === "unavailable") {
    return {
      status: 503,
      token: null,
    };
  }

  if (
    access.status !== "authenticated" ||
    access.user.role !== "vendor"
  ) {
    return {
      status: 403,
      token: null,
    };
  }

  const store = await cookies();
  const token = store.get("afhbh_session")?.value;

  return token
    ? { status: 200, token }
    : { status: 401, token: null };
}

function authFailure(status: number) {
  return reply({
    success: false,
    message:
      status === 401
        ? "Please sign in again."
        : status === 503
          ? "Account verification is unavailable."
          : "Safari operator access required.",
  }, status);
}

function upstreamFailure(status: number) {
  const code = [401, 403, 409, 422, 429]
    .includes(status)
      ? status
      : 503;

  return reply({
    success: false,
    message:
      status === 401
        ? "Your session has expired."
        : status === 403
          ? "You cannot perform this action."
          : status === 409
            ? "A company profile already exists."
            : status === 422
              ? "Review your company information."
              : status === 429
                ? "Too many requests. Try again later."
                : "Company service is temporarily unavailable.",
  }, code);
}

export async function GET() {
  const authorization = await vendorToken();

  if (!authorization.token) {
    return authFailure(authorization.status);
  }

  try {
    const response = await fetch(API, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authorization.token}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return upstreamFailure(response.status);
    }

    const payload: unknown = await response.json();

    if (
      !isRecord(payload) ||
      !Array.isArray(payload.data) ||
      payload.data.length > 1
    ) {
      throw new Error("Unexpected company response.");
    }

    const companies: Company[] = [];

    for (const item of payload.data) {
      const company = parseCompany(item);

      if (!company) {
        throw new Error("Invalid company record.");
      }

      companies.push(company);
    }

    return reply({
      success: true,
      data: companies,
    });
  } catch {
    return reply({
      success: false,
      message: "Unable to load your company information.",
    }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return reply({
      success: false,
      message: "Request not allowed.",
    }, 403);
  }

  const authorization = await vendorToken();

  if (!authorization.token) {
    return authFailure(authorization.status);
  }

  const body: unknown = await request.json()
    .catch(() => null);

  if (!isRecord(body)) {
    return reply({
      success: false,
      message: "Invalid company registration.",
    }, 422);
  }

  const allowed = [
    "legal_name",
    "display_name",
    "tax_id",
    "payout_method",
  ];

  if (
    Object.keys(body).some(
      key => !allowed.includes(key)
    )
  ) {
    return reply({
      success: false,
      message: "Unsupported company fields.",
    }, 422);
  }

  const legalName = body.legal_name;
  const displayName = body.display_name;
  const taxId = body.tax_id;
  const payoutMethod = body.payout_method;

  if (
    typeof legalName !== "string" ||
    !legalName.trim() ||
    legalName.trim().length > 255 ||
    (
      displayName !== undefined &&
      typeof displayName !== "string"
    ) ||
    (
      typeof displayName === "string" &&
      displayName.trim().length > 255
    ) ||
    (
      taxId !== undefined &&
      typeof taxId !== "string"
    ) ||
    (
      typeof taxId === "string" &&
      taxId.trim().length > 255
    ) ||
    !["bank", "mobile_money"].includes(
      String(payoutMethod)
    )
  ) {
    return reply({
      success: false,
      message: "Please enter valid company details.",
    }, 422);
  }

  const payload = {
    legal_name: legalName.trim(),
    display_name:
      typeof displayName === "string" &&
      displayName.trim()
        ? displayName.trim()
        : legalName.trim(),
    tax_id:
      typeof taxId === "string" && taxId.trim()
        ? taxId.trim()
        : null,
    type: "safari_operator",
    payout_method: payoutMethod,
  };

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${authorization.token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return upstreamFailure(response.status);
    }

    const result: unknown = await response.json();

    if (!isRecord(result)) {
      throw new Error("Invalid creation response.");
    }

    const company = parseCompany(result.data);

    if (
      !company ||
      company.status !== "pending" ||
      company.type !== "safari_operator"
    ) {
      throw new Error("Unexpected created company.");
    }

    return reply({
      success: true,
      message: "Company submitted for verification.",
      data: company,
    }, 201);
  } catch {
    return reply({
      success: false,
      message: "Unable to confirm company registration.",
    }, 503);
  }
}
