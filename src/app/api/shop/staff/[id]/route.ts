import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getManagedShop } from "@/lib/route-auth";
import { setStaffActive } from "@/lib/staff-repo";

// Turns a staff member's PIN off (they've left) or back on. Members are
// never deleted, so the activity log keeps their name.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<{ active?: unknown }>(request);
  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "active must be true or false" }, { status: 400 });
  }
  if (!(await setStaffActive(shop.id, params.id, body.active))) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
