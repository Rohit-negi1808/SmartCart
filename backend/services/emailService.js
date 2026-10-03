// All outbound email logic lives here so SMTP details never leak into
// controllers. Configured entirely from environment variables - never
// hard-code credentials, addresses, or the "from" name here.

const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/25 (STARTTLS)
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
};

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);

/**
 * Sends the OTP verification email. Throws if SMTP fails or is
 * unconfigured - the caller (authController) decides how to surface
 * that to the user (it should NOT silently pretend the email was sent).
 */
const sendOTPEmail = async (toEmail, otp, name = null) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transport = getTransporter();
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  const subject = 'Verify your SmartCart account';
  const text = `${greeting}

Your SmartCart verification OTP is: ${otp}

This code expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, you can safely ignore this email.

- SmartCart`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1B1E27;">
      <h2 style="margin-bottom: 8px;">Verify your SmartCart account</h2>
      <p>${greeting}</p>
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; background: #F2F2F2; padding: 12px 20px; display: inline-block; border-radius: 8px;">${otp}</p>
      <p>This code expires in <strong>${OTP_TTL_MINUTES} minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
      <p style="color: #9AA1B2; font-size: 12px; margin-top: 24px;">SmartCart · AI-powered product discovery</p>
    </div>`;

  await transport.sendMail({ from, to: toEmail, subject, text, html });
};

module.exports = { sendOTPEmail, OTP_TTL_MINUTES };
