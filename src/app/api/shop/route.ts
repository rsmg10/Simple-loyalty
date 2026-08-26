import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getShop } from "@/lib/shop-repo";
import { STAFF_SESSION_COOKIE, verifyStaffSessionCookie } from "@/lib/staff-session";

const MIN_STAMPS_REQUIRED = 3;
const MAX_STAMPS_REQUIRED = 20;

// Shop config is read from the database on every request — never prerender
// or cache this route.
export const dynamic = "force-dynamic";

export async function GET() {
  const shop = await getShop();
  return NextResponse.json({ name: shop.name, stampsRequired: shop.stampsRequired });
}

export async function PUT(request: Request) {
  const shop = await getShop();
  const sessionCookie = cookies().get(STAFF_SESSION_COOKIE)?.value;
  if (!verifyStaffSessionCookie(sessionCookie, shop.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, stampsRequired, staffPin } = body as {
    name?: string;
    stampsRequired?: number;
    staffPin?: string;
  };

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
  }
  if (
    typeof stampsRequired !== "number" ||
    !Number.isInteger(stampsRequired) ||
    stampsRequired < MIN_STAMPS_REQUIRED ||
    stampsRequired > MAX_STAMPS_REQUIRED
  ) {
    return NextResponse.json(
      { error: `Stamps required must be a whole number between ${MIN_STAMPS_REQUIRED} and ${MAX_STAMPS_REQUIRED}.` },
      { status: 400 },
    );
  }
  const trimmedPin = typeof staffPin === "string" ? staffPin.trim() : "";
  if (trimmedPin && trimmedPin.length < 4) {
    return NextResponse.json({ error: "Staff PIN must be at least 4 characters." }, { status: 400 });
  }

  const update: { name: string; stamps_required: number; staff_pin_hash?: string } = {
    name: name.trim(),
    stamps_required: stampsRequired,
  };
  if (trimmedPin) update.staff_pin_hash = await bcrypt.hash(trimmedPin, 10);

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("shops").update(update).eq("id", shop.id);

  if (error) {
    return NextResponse.json({ error: "Failed to save shop config" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
