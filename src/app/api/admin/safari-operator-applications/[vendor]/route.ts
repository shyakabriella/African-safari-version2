import { reply } from "@/lib/auth/server";
import { forwardOperatorApproval } from
  "@/lib/admin/operator-approvals";

type Context = {
  params: Promise<{ vendor: string }>;
};

export async function GET(
  _request: Request,
  context: Context,
) {
  const { vendor } = await context.params;

  if (!/^[1-9]\d{0,14}$/.test(vendor)) {
    return reply({
      success: false,
      message: "Invalid Safari Operator ID.",
    }, 422);
  }

  return forwardOperatorApproval(`/${vendor}`);
}
