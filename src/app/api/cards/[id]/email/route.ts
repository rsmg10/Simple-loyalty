import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { email } = body as { email?: string };

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cards")
    .update({ email: email.trim() })
    .eq("id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json(toCardJson(data));
}
