import nodemailer from "nodemailer";

// Contact-form mail goes out through the owner's Google Workspace mailbox (SMTP with
// an app password), to that same mailbox, with Reply-To set to the sender.
export const MAIL_TO = "ataberk@ataberksoylu.com";

export async function sendMail({ subject, text, replyTo }: { subject: string; text: string; replyTo: string }) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("SMTP_USER / SMTP_PASS not set");
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  await transport.sendMail({ from: `"ataberksoylu.com" <${user}>`, to: MAIL_TO, replyTo, subject, text });
}
