import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cards")
    .update({ email: null })
    .eq("id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json(toCardJson(data));
}
