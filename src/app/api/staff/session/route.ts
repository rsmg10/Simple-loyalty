import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/parse-json-body";
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

  const body = await parseJsonBody<{ pin?: string }>(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { pin } = body;

  if (typeof pin !== "string" || pin !== shop.staffPin) {
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
