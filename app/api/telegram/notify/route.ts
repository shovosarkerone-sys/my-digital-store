import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  
  if (!token || !chat) return NextResponse.json({ error: "Missing Vercel Config" });

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chat_id: chat, 
      text: "✅ Notify API Test: I am ready to receive support tickets!" 
    })
  });
  return NextResponse.json({ status: "Working!" });
}

export async function POST(req: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chat) return NextResponse.json({ error: "Missing config" });

    const body = await req.json();
    const telegramText = `🚨 <b>New Support Ticket</b>\n\n<b>Ticket ID:</b> #${body.ticketId || "N/A"}\n<b>Name:</b> ${body.userName || "Guest"}\n<b>Email:</b> ${body.email || "N/A"}\n<b>Subject:</b> ${body.subject || "No Subject"}\n<b>Message:</b> ${body.message || "No Message"}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        chat_id: chat, 
        text: telegramText, 
        parse_mode: "HTML" 
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}