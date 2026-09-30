import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET() {
  return NextResponse.json({ status: "Working" });
}

export async function POST(req: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
    
    if (!token || !chat) return NextResponse.json({ error: "Missing config" });

    const body = await req.json();
    const { ticketId, userName, email, subject, message } = body;

    let header = "🚨 <b>New Support Ticket</b>";
    if (subject === "New Product Added") header = `📦 <b>${userName || "Someone"} added a new product!</b>`;
    else if (subject === "Product Edited") header = `📝 <b>${userName || "Someone"} edited a product!</b>`;
    else if (subject === "Product Deleted") header = `🗑️ <b>${userName || "Someone"} deleted a product!</b>`;
    else if (subject === "New Direct Message") header = `💬 <b>New direct message from ${userName || "User"}!</b>`;

    const telegramText = `${header}\n\n<b>Ref ID:</b> #${ticketId || "N/A"}\n<b>Email:</b> ${email || "N/A"}\n<b>Subject:</b> ${subject || "No Subject"}\n<b>Details:</b> ${message || "No Message"}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: telegramText, parse_mode: "HTML" })
    });

    if (email && email !== "N/A" && !subject.includes("Product")) {
      const emailSubject = `Request Received: ${subject}`;
      const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:10px;"><h2 style="color:#0ea5e9;">Inskeys Support</h2><p>Hello <strong>${userName || "Customer"}</strong>,</p><p>We received your request. Our team is reviewing it.</p><div style="background-color:#f8fafc;padding:15px;border-radius:8px;margin:20px 0;"><p style="margin:0;color:#64748b;font-size:14px;"><strong>Ticket ID:</strong> #${ticketId}</p><p style="margin:5px 0 0 0;color:#64748b;font-size:14px;"><strong>Subject:</strong> ${subject}</p></div></div>`;
      await sendEmail(email, emailSubject, emailHtml);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}