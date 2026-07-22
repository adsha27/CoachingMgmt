import nodemailer, { type Transporter } from "nodemailer";

const WORKSPACE_EMAIL = "liveclass@coursesdssirchemistry.com";

let transporter: Transporter | null = null;

function getTransporter() {
  const user = process.env.SMTP_USER ?? WORKSPACE_EMAIL;
  const pass = process.env.SMTP_PASS;
  if (!pass) throw new Error("SMTP_PASS not configured");
  transporter ??= nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ id: string }> {
  // Non-production environments prefix the subject, so a message that reaches a
  // real inbox is unmistakably a test. Only set outside production.
  const subject = process.env.EMAIL_SUBJECT_PREFIX
    ? `${process.env.EMAIL_SUBJECT_PREFIX} ${params.subject}`
    : params.subject;

  if (process.env.EMAIL_DELIVERY_MODE === "console") {
    console.log("[email:console]", {
      to: params.to,
      subject,
      text: params.text,
    });
    return { id: `console-${Date.now()}` };
  }

  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM ?? WORKSPACE_EMAIL,
    to: params.to,
    subject,
    html: params.html,
    text: params.text,
  });

  return { id: info.messageId };
}
