import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getShop, isPinLocked, recordFailedPinAttempt, resetPinAttempts } from "@/lib/shop-repo";
import { STAFF_SESSION_COOKIE, createStaffSessionCookie } from "@/lib/staff-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const shop = await getShop();

  if (isPinLocked(shop)) {
    return NextResponse.json(
      { error: "Too many incorrect attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { pin } = body as { pin?: string };

  if (typeof pin !== "string" || !(await bcrypt.compare(pin, shop.staffPinHash))) {
    await recordFailedPinAttempt(shop);
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  await resetPinAttempts(shop);

  const { value, maxAge } = createStaffSessionCookie(shop.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return response;
}
