import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  
  try {
    await resend.emails.send({
      from: "Inskeys Support <no-reply@inskeys.com>",
      to: to,
      subject: subject,
      html: html,
    });
  } catch (error) {
    console.error("Email Error:", error);
  }
}