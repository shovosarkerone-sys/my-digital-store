export async function sendTelegramAlert(message: string, userChatId?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "8857089186:AAFI8d21o5Kg573dVg8VKRx0_xC1oY311hM";
  const targetChatId = userChatId || process.env.TELEGRAM_ADMIN_CHAT_ID || "6580208030";

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (error) {
    console.error("Telegram error:", error);
  }
}