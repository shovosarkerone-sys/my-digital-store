export async function sendTelegramAlert(message: string, userChatId?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = userChatId || process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !targetChatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${8857089186:AAHtHI8C7x3GUC2kT9kUpDX32g3RvZI1Owg}/sendMessage`, {
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