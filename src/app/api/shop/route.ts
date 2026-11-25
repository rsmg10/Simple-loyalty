import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { isAppleWalletConfigured } from "@/lib/apple-wallet";
import { isGoogleWalletConfigured } from "@/lib/google-wallet";
import { isValidBrandColor } from "@/lib/logo";
import { parseJsonBody } from "@/lib/parse-json-body";
import { MAX_WELCOME_BONUS, isDoubleStampDay, isValidWeekdayList } from "@/lib/promotions";
import { getManagedShop } from "@/lib/route-auth";
import { getShop } from "@/lib/shop-repo";
import { findStaffByPin } from "@/lib/staff-repo";
import { getSupabaseAdmin } from "@/lib/supabase";

const MIN_STAMPS_REQUIRED = 3;
const MAX_STAMPS_REQUIRED = 20;
const MAX_REWARD_NAME = 40;

// Shop config is read from the database on every request — never prerender
// or cache this route.
export const dynamic = "force-dynamic";

export async function GET() {
  const shop = await getShop();
  return NextResponse.json({
    name: shop.name,
    stampsRequired: shop.stampsRequired,
    rewardName: shop.rewardName,
    brandColor: shop.brandColor,
    // Versioned so phones cache the image until it changes.
    logoUrl: shop.logoUpdatedAt ? `/api/shop/logo?v=${new Date(shop.logoUpdatedAt).getTime()}` : null,
    welcomeBonus: shop.welcomeBonus,
    doubleStampWeekdays: shop.doubleStampWeekdays,
    doubleStampsToday: isDoubleStampDay(shop.doubleStampWeekdays, shop.timezone),
    appleWalletEnabled: isAppleWalletConfigured(),
    googleWalletEnabled: isGoogleWalletConfigured(),
    // Without Resend the reminder is never sent, so don't ask for an email.
    emailRemindersEnabled: Boolean(process.env.RESEND_API_KEY),
  });
}

type ShopUpdateBody = {
  name?: unknown;
  stampsRequired?: unknown;
  staffPin?: unknown;
  rewardName?: unknown;
  brandColor?: unknown;
  welcomeBonus?: unknown;
  doubleStampWeekdays?: unknown;
};

// Name and stamps-required are always sent by the settings form; the rest
// are optional, so an older client that doesn't send them changes nothing.
export async function PUT(request: Request) {
  const shop = await getManagedShop();
  if (!shop) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<ShopUpdateBody>(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { name, stampsRequired, staffPin, rewardName, brandColor, welcomeBonus, doubleStampWeekdays } = body;
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

  if (typeof name !== "string" || !name.trim()) return bad("Shop name is required");
  if (
    typeof stampsRequired !== "number" ||
    !Number.isInteger(stampsRequired) ||
    stampsRequired < MIN_STAMPS_REQUIRED ||
    stampsRequired > MAX_STAMPS_REQUIRED
  ) {
    return bad(`Stamps required must be a whole number between ${MIN_STAMPS_REQUIRED} and ${MAX_STAMPS_REQUIRED}.`);
  }

  const update: Record<string, unknown> = { name: name.trim(), stamps_required: stampsRequired };

  const trimmedPin = typeof staffPin === "string" ? staffPin.trim() : "";
  if (trimmedPin) {
    if (trimmedPin.length < 4) return bad("Staff PIN must be at least 4 characters.");
    // A staff member's PIN can't double as the manager PIN — login couldn't
    // tell them apart.
    if (await findStaffByPin(shop.id, trimmedPin)) return bad("That PIN is already a staff member's PIN.");
    update.staff_pin_hash = await bcrypt.hash(trimmedPin, 10);
  }

  if (rewardName !== undefined) {
    if (rewardName !== null && (typeof rewardName !== "string" || rewardName.trim().length > MAX_REWARD_NAME)) {
      return bad(`Reward name must be at most ${MAX_REWARD_NAME} characters.`);
    }
    update.reward_name = typeof rewardName === "string" && rewardName.trim() ? rewardName.trim() : null;
  }
  if (brandColor !== undefined) {
    if (brandColor !== null && !isValidBrandColor(brandColor)) return bad("Brand colour must look like #1a3a3a.");
    update.brand_color = brandColor;
  }
  if (welcomeBonus !== undefined) {
    if (typeof welcomeBonus !== "number" || !Number.isInteger(welcomeBonus) || welcomeBonus < 0 || welcomeBonus > MAX_WELCOME_BONUS) {
      return bad(`Welcome bonus must be 0 to ${MAX_WELCOME_BONUS} stamps.`);
    }
    update.welcome_bonus = welcomeBonus;
  }
  if (doubleStampWeekdays !== undefined) {
    if (!isValidWeekdayList(doubleStampWeekdays)) return bad("Double-stamp days must be weekdays 0–6.");
    update.double_stamp_weekdays = doubleStampWeekdays;
  }

  const { error } = await getSupabaseAdmin().from("shops").update(update).eq("id", shop.id);
  if (error) {
    return NextResponse.json({ error: "Failed to save shop config" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
