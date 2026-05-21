import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  resend ??= new Resend(apiKey);
  return resend;
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ id: string }> {
  if (process.env.EMAIL_DELIVERY_MODE === "console") {
    console.log("[email:console]", {
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    return { id: `console-${Date.now()}` };
  }

  const { data, error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@yourdomain.com",
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Resend returned no data");
  }

  return { id: data.id };
}
