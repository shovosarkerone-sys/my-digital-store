import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "Notify API is working!" });
}

export async function POST(req: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
    
    if (!token || !chat) {
      return NextResponse.json({ error: "Missing config" });
    }

    const body = await req.json();
    const { ticketId, userName, email, subject, message } = body;

    let header = "🚨 <b>New Support Ticket</b>";
    
    // ডাইনামিক হেডিং সেট করা হচ্ছে
    if (subject === "New Product Added") {
        header = `📦 <b>${userName || "Someone"} added a new product!</b>`;
    } else if (subject === "Product Edited") {
        header = `📝 <b>${userName || "Someone"} edited a product!</b>`;
    } else if (subject === "Product Deleted") {
        header = `🗑️ <b>${userName || "Someone"} deleted a product!</b>`;
    } else if (subject === "New Direct Message") {
        header = `💬 <b>New direct message from ${userName || "User"}!</b>`;
    }

    const telegramText = `${header}\n\n<b>Ref ID:</b> #${ticketId || "N/A"}\n<b>Email:</b> ${email || "N/A"}\n<b>Subject:</b> ${subject || "No Subject"}\n<b>Details:</b> ${message || "No Message"}`;

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