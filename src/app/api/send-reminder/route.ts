import { NextResponse } from "next/server";
import { Resend } from "resend";

type ReminderPayload = {
  email?: string;
  shopName?: string;
  stampsRemaining?: number;
};

export async function POST(request: Request) {
  const { email, shopName, stampsRemaining }: ReminderPayload = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return NextResponse.json({ error: "Email sending not configured" }, { status: 503 });
  }

  const resend = new Resend(apiKey);
  const shop = shopName ?? "the shop";

  try {
    const { error } = await resend.emails.send({
      from: "Loyalty Card <onboarding@resend.dev>",
      to: email,
      subject: `You're ${stampsRemaining ?? 1} stamp away from a free coffee at ${shop}!`,
      text: `Just one more visit to ${shop} and your next coffee is on us. See you soon!`,
    });

    if (error) {
      console.error("Resend returned an error", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send reminder email", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }
}
