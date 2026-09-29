import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;

  // চেক করবে Vercel-এর ভেতরে আসলেই কিগুলো সেভ হয়েছে কিনা
  if (!token || !chat) {
    return NextResponse.json({
      status: "Failed",
      reason: "Vercel cannot find the Environment Variables.",
      isTokenSaved: !!token,
      isChatIdSaved: !!chat
    });
  }

  // সব ঠিক থাকলে টেলিগ্রামে একটা টেস্ট মেসেজ পাঠিয়ে রেজাল্ট দেখাবে
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: "✅ System Debug: Backend is perfectly connected!" })
    });
    const data = await res.json();
    return NextResponse.json({ status: "Telegram API Response", data });
  } catch (err: any) {
    return NextResponse.json({ status: "Network Error", message: err.message });
  }
}