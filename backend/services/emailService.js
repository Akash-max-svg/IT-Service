const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const user = process.env.SMTP_USER || 'oemjmobqejmz2sxo@ethereal.email';
  const pass = process.env.SMTP_PASS || 'jrUzsK7tqvppbUPHgH';
  const port = process.env.SMTP_PORT || 587;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: process.env.SMTP_SECURE === 'true' || port == 465,
      auth: { user, pass },
    });
  } else {
    // Development/Fallback mock transporter
    transporter = {
      sendMail: async (mailOptions) => {
        console.log(`\n📧 [EMAIL DISPATCHED - SIMULATED]`);
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Message Snippet: ${mailOptions.text || mailOptions.html.replace(/<[^>]*>/g, '').substring(0, 100)}...`);
        console.log(`──────────────────────────────────────────\n`);
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }
};

initTransporter();

/**
 * Sends transactional ticket email
 */
const sendTicketEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to) return;
    const from = process.env.EMAIL_FROM || '"IT Service Desk" <servicedesk@company.internal>';
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    });
    return info;
  } catch (error) {
    console.error('Email sending error:', error.message);
  }
};

/**
 * Sends email verification code to user
 */
const sendVerificationEmail = async ({ to, name, code, role }) => {
  try {
    if (!to) return;
    const from = process.env.EMAIL_FROM || '"IT Service Desk" <support@servicedesk.local>';
    const subject = `Your IT Service Desk Verification Code: ${code}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 30px; color: #e2e8f0; }
          .container { max-width: 540px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .badge { display: inline-block; background: #6366f1; color: #ffffff; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          h1 { color: #ffffff; font-size: 24px; margin-top: 14px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .code-box { background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; text-align: center; padding: 22px; margin: 28px 0; }
          .code { font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #818cf8; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">IT Service Desk</span>
            <h1>Email Verification</h1>
          </div>
          <p>Hello <strong>${name || 'there'}</strong>,</p>
          <p>Thank you for registering for the <strong>IT Service Desk & Incident Management System</strong> with role <strong>${role || 'Employee'}</strong>.</p>
          <p>Please enter the following 6-digit verification code to confirm your email address and activate your account:</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p>This code will expire in <strong>15 minutes</strong>. If you did not request this verification, please disregard this email.</p>
          <div class="footer">
            <p>IT Service Desk Platform &bull; Automated Identity Verification</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hello ${name || 'there'},\n\nYour IT Service Desk verification code is: ${code}\n\nThis code will expire in 15 minutes.\nRole: ${role || 'Employee'}\n`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    if (info && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`\n📬 [TEST EMAIL INBOX PREVIEW]: ${previewUrl}\n`);
      }
    }
    return info;
  } catch (error) {
    console.error('Verification email error:', error.message);
  }
};

module.exports = {
  sendTicketEmail,
  sendVerificationEmail,
};
