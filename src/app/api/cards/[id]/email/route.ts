import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getSupabaseAdmin } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<{ email?: string }>(request);
  if (!body || typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email.trim())) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const email = body.email.trim();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cards")
    .update({ email })
    .eq("id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json(toCardJson(data));
}
