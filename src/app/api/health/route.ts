import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("shops").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
