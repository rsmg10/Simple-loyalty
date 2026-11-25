import { NextResponse } from "next/server";
import { redeemReward } from "@/lib/card-actions";
import { getStaffContext } from "@/lib/route-auth";

// Staff hand over one saved reward.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const context = await getStaffContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await redeemReward(params.id, context.shop.id, context.staffMemberId);
  if (!result.ok) {
    return result.error === "no_reward"
      ? NextResponse.json({ error: "No reward to use", code: "no_reward" }, { status: 409 })
      : NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ ...result.card, eventId: result.eventId });
}
