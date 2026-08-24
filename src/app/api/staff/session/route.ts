import { NextResponse } from "next/server";
import { getShop } from "@/lib/shop-repo";
import { STAFF_SESSION_COOKIE, createStaffSessionCookie } from "@/lib/staff-session";

export async function POST(request: Request) {
  const shop = await getShop();
  const body = await request.json();
  const { pin } = body as { pin?: string };

  if (typeof pin !== "string" || pin !== shop.staffPin) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

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
