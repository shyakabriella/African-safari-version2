import { NextRequest } from "next/server";

import {
  getUsersDirectory,
} from "@/lib/admin/directory";

import {
  reply,
} from "@/lib/auth/server";

export async function GET(
  request: NextRequest
) {
  const result = await getUsersDirectory(
    request.nextUrl.searchParams
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
