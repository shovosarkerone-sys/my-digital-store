import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error("🚨 Error: Vercel-এ RESEND_API_KEY পাওয়া যাচ্ছে না!");
    return;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: "Inskeys Support <no-reply@inskeys.com>",
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("🚨 Resend API Error:", error);
      return;
    }

    console.log("✅ Email sent successfully! ID:", data?.id);
  } catch (err) {
    console.error("🚨 Server Error:", err);
  }
}