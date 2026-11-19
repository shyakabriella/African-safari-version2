import { NextRequest } from "next/server";

import {
  getUserSummary,
} from "@/lib/admin/users";

import {
  reply,
} from "@/lib/auth/server";

export async function GET(
  request: NextRequest
) {
  const result = await getUserSummary();

  if (!result.ok) {
    return reply({
      success: false,
      message: result.message,
    }, result.status);
  }

  if (request.nextUrl.search) {
    return reply({
      success: false,
      message: "Unexpected query parameters.",
    }, 422);
  }

  return reply({
    success: true,
    data: result.data,
  });
}
