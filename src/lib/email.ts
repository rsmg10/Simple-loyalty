import { Resend } from "resend";

// Resend's shared sandbox sender. It only delivers to the Resend account
// owner's own address, so it's fine for local testing and useless for real
// customers — set EMAIL_FROM_ADDRESS to an address on a domain verified in
// Resend before launch.
const SANDBOX_FROM_ADDRESS = "onboarding@resend.dev";

export function buildFromHeader(shopName: string, address: string | undefined): string {
  // Strip characters that would break out of the quoted display name.
  const displayName = shopName.replace(/["\\<>\r\n]/g, "").trim() || "Loyalty Card";
  return `"${displayName}" <${address || SANDBOX_FROM_ADDRESS}>`;
}

export async function sendStampReminderEmail(
  email: string,
  shopName: string,
  stampsRemaining: number,
  cardId: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return;
  }

  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  if (!fromAddress) {
    console.error(
      "EMAIL_FROM_ADDRESS is not configured — sending from Resend's sandbox address, which only delivers to the Resend account owner",
    );
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: buildFromHeader(shopName, fromAddress),
      to: email,
      subject: `You're ${stampsRemaining} stamp away from a free coffee at ${shopName}!`,
      text: `Just one more visit to ${shopName} and your next coffee is on us. See you soon!\n\n${emailFooter(cardId)}`,
    });

    if (error) {
      console.error("Resend returned an error", error);
    }
  } catch (error) {
    console.error("Failed to send reminder email", error);
  }
}

function emailFooter(cardId: string): string {
  const lines = [unsubscribeLine(cardId)];
  // CAN-SPAM requires a physical mailing address in commercial email sent
  // to US recipients. The app can't infer one, so it's configured.
  const mailingAddress = process.env.EMAIL_MAILING_ADDRESS;
  if (mailingAddress) lines.push(mailingAddress);
  return lines.join("\n");
}

function unsubscribeLine(cardId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("NEXT_PUBLIC_APP_URL is not configured — reminder email sent without an unsubscribe link");
    return "Reply to this email to stop these reminders.";
  }
  return `Don't want these emails? Unsubscribe: ${appUrl}/unsubscribe?card=${cardId}`;
}
