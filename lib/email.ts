export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // In a real production app (Uber/Airbnb style), you would use Sendgrid, Postmark, AWS SES, or Nodemailer here.
  // Since we lack the SMTP setup at this moment, we output to console to simulate the email sending.
  console.log("---- SENDING EMAIL ----");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body:", html);
  console.log("------------------------");
  return true;
}
