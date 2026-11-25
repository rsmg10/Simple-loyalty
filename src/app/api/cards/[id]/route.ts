import { NextResponse } from "next/server";
import { toCardJson } from "@/lib/card-json";
import { getShopCard } from "@/lib/shop-card";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { card } = await getShopCard(params.id);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json(toCardJson(card));
}
