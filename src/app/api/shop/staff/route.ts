import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getManagedShop } from "@/lib/route-auth";
import { createStaff, isPinTaken, listStaff } from "@/lib/staff-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ staff: await listStaff(shop.id) });
}

// Adds a staff member with their own PIN: they can stamp and hand out
// rewards, and their actions are logged under their name.
export async function POST(request: Request) {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<{ name?: unknown; pin?: unknown }>(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  if (!name || name.length > 40) {
    return NextResponse.json({ error: "Enter a name (up to 40 characters)", code: "invalid_name" }, { status: 400 });
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 to 8 digits", code: "invalid_pin" }, { status: 400 });
  }
  // Login identifies who's signing in by PIN alone, so PINs must be unique.
  if (await isPinTaken(shop.id, shop.staffPinHash, pin)) {
    return NextResponse.json({ error: "That PIN is already in use", code: "pin_taken" }, { status: 409 });
  }

  const member = await createStaff(shop.id, name, pin);
  if (!member) {
    return NextResponse.json({ error: "Failed to add staff member" }, { status: 500 });
  }
  return NextResponse.json(member);
}
