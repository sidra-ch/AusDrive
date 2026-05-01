// @ts-ignore - @sendgrid/mail is optional and loaded at runtime if available
import sgMail from "@sendgrid/mail";

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    // If SendGrid is configured, use it
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        html,
      };

      const result = await sgMail.send(msg);
      console.log(`✅ [EMAIL SENT] To: ${to}, Subject: ${subject}`);
      return true;
    }

    // Fallback: Log to console if SendGrid not configured
    console.log("---- SENDING EMAIL (CONSOLE MODE) ----");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", html);
    console.log("------------------------");
    console.log("⚠️  SendGrid not configured. Configure SENDGRID_API_KEY and SENDGRID_FROM_EMAIL to send real emails.");
    return true;
  } catch (error) {
    console.error("❌ [EMAIL ERROR]", error);
    throw error;
  }
}
