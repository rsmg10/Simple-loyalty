import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("cards")
    .select("redemptions")
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("cards")
    .update({ last_seen_redemptions: existing.redemptions })
    .eq("id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }

  return NextResponse.json(toCardJson(data));
}
