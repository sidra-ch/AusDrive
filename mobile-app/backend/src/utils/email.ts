import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@ausdrive.com.au",
    to: email,
    subject: "Verify your email for AusDrive Premium",
    html: `<h1>Welcome to AusDrive Premium!</h1>
           <p>Please use the following code to verify your email:</p>
           <h2>${token}</h2>
           <p>If you didn't request this, you can safely ignore this email.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@ausdrive.com.au",
    to: email,
    subject: "Password Reset Request",
    html: `<h1>Password Reset</h1>
           <p>We received a request to reset your password.</p>
           <p>Use the following token to reset your password:</p>
           <h2>${token}</h2>
           <p>If you didn't request this, you can safely ignore this email.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
