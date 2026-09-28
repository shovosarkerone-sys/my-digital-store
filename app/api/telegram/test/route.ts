import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { chatId, userName } = await req.json();
    if (!chatId) return NextResponse.json({ error: "No chat ID provided" }, { status: 400 });

    const message = `✅ <b>Hello ${userName || "User"}!</b>\nYour Telegram is successfully connected to <b>Inskeys</b>. You will now receive instant notifications here.`;
    
    await sendTelegramAlert(message, chatId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send test message" }, { status: 500 });
  }
}