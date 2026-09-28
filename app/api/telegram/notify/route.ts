import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { subject, email, message, ticketId, userName } = await req.json();

    const text = `🚨 <b>New Support Ticket!</b>\n\n<b>Ticket ID:</b> #${ticketId}\n<b>From:</b> ${userName} (${email})\n<b>Subject:</b> ${subject}\n\n<b>Message:</b>\n<i>${message}</i>`;

    await sendTelegramAlert(text);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send alert" }, { status: 500 });
  }
}