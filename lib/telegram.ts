export async function sendTelegramAlert(message: string, userChatId?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = userChatId || process.env.TELEGRAM_ADMIN_CHAT_ID; 

  if (!botToken || !targetChatId) return;

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
  } catch (error) {}
}