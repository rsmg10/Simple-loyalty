import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getOwnerUserId } from "@/lib/owner-auth";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getShopByOwnerUserId } from "@/lib/shop-repo";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isValidSlug } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const DEFAULT_STAMPS_REQUIRED = 9;

function redirectUrlFor(slug: string | null): string {
  return `https://${slug ?? ""}.${process.env.APP_ROOT_DOMAIN}/setup`;
}

// Self-serve shop creation — only exists for a multi-tenant deployment.
// A single-café deployment already has its one shop; there's nowhere for a
// second one to go, so this 404s outright rather than doing anything.
export async function POST(request: Request) {
  if (!process.env.APP_ROOT_DOMAIN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ownerUserId = await getOwnerUserId();
  if (!ownerUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // One shop per owner account for now — see shops_owner_user_id_idx in
  // supabase/migrations/0001_initial.sql for the DB-level backstop against a double-submit
  // race slipping past this check.
  const existingShop = await getShopByOwnerUserId(ownerUserId);
  if (existingShop) {
    return NextResponse.json(
      { error: "You already have a shop", redirectUrl: redirectUrlFor(existingShop.slug) },
      { status: 409 },
    );
  }

  const body = await parseJsonBody<{ shopName?: string; slug?: string; staffPin?: string }>(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { shopName, slug, staffPin } = body;

  if (typeof shopName !== "string" || !shopName.trim()) {
    return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
  }
  if (typeof slug !== "string" || !isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Subdomain must be 3-63 characters: lowercase letters, numbers, and hyphens only." },
      { status: 400 },
    );
  }
  const trimmedPin = typeof staffPin === "string" ? staffPin.trim() : "";
  if (trimmedPin.length < 4) {
    return NextResponse.json({ error: "Staff PIN must be at least 4 characters." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shops")
    .insert({
      name: shopName.trim(),
      slug,
      stamps_required: DEFAULT_STAMPS_REQUIRED,
      staff_pin_hash: await bcrypt.hash(trimmedPin, 10),
      owner_user_id: ownerUserId,
    })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation — either the slug or (in the double-submit
    // race case) owner_user_id collided with an existing row.
    if (error.code === "23505") {
      return NextResponse.json({ error: "That subdomain is taken. Try another." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }

  return NextResponse.json({ redirectUrl: redirectUrlFor(data.slug) });
}
