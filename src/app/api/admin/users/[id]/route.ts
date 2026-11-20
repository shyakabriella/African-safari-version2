import type { NextRequest } from "next/server";

import {
  getUserDetails,
} from "@/lib/admin/user-details";

import {
  reply,
} from "@/lib/auth/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  const result = await getUserDetails(
    id,
    Boolean(request.nextUrl.search)
  );

  if (!result.ok) {
    return reply({
      success: false,
      message: result.message,
    }, result.status);
  }

  return reply({
    success: true,
    data: result.data,
  });
}
