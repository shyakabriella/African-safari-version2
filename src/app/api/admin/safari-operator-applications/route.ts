import type { NextRequest } from "next/server";

import { reply } from "@/lib/auth/server";
import { forwardOperatorApproval } from
  "@/lib/admin/operator-approvals";

const validStatuses = new Set([
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  for (const key of params.keys()) {
    if (
      !["status", "page"].includes(key) ||
      params.getAll(key).length !== 1
    ) {
      return reply({
        success: false,
        message: "Invalid application filters.",
      }, 422);
    }
  }

  const status = params.get("status") ?? "pending";
  const page = params.get("page") ?? "1";

  if (
    !validStatuses.has(status) ||
    !/^[1-9]\d{0,5}$/.test(page) ||
    Number(page) > 100000
  ) {
    return reply({
      success: false,
      message: "Invalid application filters.",
    }, 422);
  }

  const query = new URLSearchParams({
    status,
    page,
    per_page: "20",
  });

  return forwardOperatorApproval(`?${query.toString()}`);
}
