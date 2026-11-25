import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { clearLoginAttempts, getLoginAttempts, saveLoginAttempts } from "@/lib/login-attempts-repo";
import { CLIENT_LIMITS, afterFailure, clientIp, clientKey, isLocked } from "@/lib/login-throttle";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getShop, isPinLocked, recordFailedPinAttempt, resetPinAttempts } from "@/lib/shop-repo";
import { findStaffByPin } from "@/lib/staff-repo";
import { STAFF_SESSION_COOKIE, createStaffSessionCookie } from "@/lib/staff-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const shop = await getShop();
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret) throw new Error("STAFF_SESSION_SECRET must be set");
  const client = clientKey(clientIp(request.headers), secret);
  const clientAttempts = await getLoginAttempts(shop.id, client);

  if (isPinLocked(shop) || isLocked(clientAttempts)) {
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

  // The shop's own PIN signs in as manager; a staff member's PIN as them.
  let staffMemberId: string | null = null;
  const isManager = typeof pin === "string" && (await bcrypt.compare(pin, shop.staffPinHash));
  if (!isManager && typeof pin === "string") staffMemberId = await findStaffByPin(shop.id, pin);

  if (!isManager && !staffMemberId) {
    await Promise.all([
      saveLoginAttempts(shop.id, client, afterFailure(clientAttempts, CLIENT_LIMITS)),
      recordFailedPinAttempt(shop),
    ]);
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  await Promise.all([resetPinAttempts(shop), clearLoginAttempts(shop.id, client)]);

  const { value, maxAge } = createStaffSessionCookie(shop.id, staffMemberId);
  const response = NextResponse.json({ ok: true, role: staffMemberId ? "staff" : "manager" });
  response.cookies.set(STAFF_SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return response;
}
