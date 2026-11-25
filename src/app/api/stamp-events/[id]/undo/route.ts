import { NextResponse } from "next/server";
import { UNDO_WINDOW_MINUTES, undoEvent } from "@/lib/card-actions";
import { getStaffContext } from "@/lib/route-auth";

// Undoes a stamp or reward handover from the counter: only the card's most
// recent change, only at the shop it happened at, only for a few minutes.
// Older mistakes are the owner's to fix from /setup.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const context = await getStaffContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await undoEvent(params.id, context.shop.id, UNDO_WINDOW_MINUTES);
  if (!result.ok) {
    return result.error === "not_found"
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Can't undo this any more", code: result.error }, { status: 409 });
  }

  return NextResponse.json(result.card);
}
