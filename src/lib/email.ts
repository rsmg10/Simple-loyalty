import { Resend } from "resend";

export async function sendStampReminderEmail(
  email: string,
  shopName: string,
  stampsRemaining: number,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: "Loyalty Card <onboarding@resend.dev>",
      to: email,
      subject: `You're ${stampsRemaining} stamp away from a free coffee at ${shopName}!`,
      text: `Just one more visit to ${shopName} and your next coffee is on us. See you soon!`,
    });

    if (error) {
      console.error("Resend returned an error", error);
    }
  } catch (error) {
    console.error("Failed to send reminder email", error);
  }
}
