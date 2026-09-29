import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, userName, email, subject, message } = body;

    const telegramText = `🚨 <b>New Support Ticket</b>\n\n<b>Ticket ID:</b> #${ticketId || "N/A"}\n<b>Name:</b> ${userName || "Guest"}\n<b>Email:</b> ${email || "N/A"}\n<b>Subject:</b> ${subject || "No Subject"}\n<b>Message:</b> ${message || "No Message"}`;

    await sendTelegramAlert(telegramText);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Notification Failed" }, { status: 500 });
  }
}