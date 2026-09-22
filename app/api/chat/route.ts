import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the official Customer Concierge and Support Executive for "Inskeys" (https://inskeys.com) — a verified digital marketplace for software licenses, gift cards, game keys, and automated vouchers.

Platform facts:
1. Delivery Options:
   - "Automatic Delivery": License keys and codes are delivered on-screen and to the order receipt immediately upon crypto payment confirmation.
   - "Manual Delivery": Orders marked with a manual delivery badge (🕒) are fulfilled directly by the merchant or official staff shortly after confirmation.
2. Buyer Protection: All orders are backed by guaranteed 36-Hour Buyer Protection safety hold to verify code activation and validity before payout.
3. Official Support Email: contact@inskeys.com
4. Payments: Processed securely via Cryptomus (BTC, USDT, LTC, and top cryptocurrencies).
5. Strict Policy: Anti-circumvention policy strictly forbids exchanging external contact info.

Capabilities & Instructions:
- Answer ANY customer question intelligently, concisely, and helpfully (digital key activation, gaming, store policies, or general conversation).
- Always maintain a polite, premium, and trustworthy merchant tone.
- Never use the term "Escrow"; always refer to safety holds as "36-Hour Buyer Protection".
- Never show internal technical details, model names, or server errors to the buyer.
- If the user writes in Bengali or Banglish, reply warmly in Bengali. If in English, reply in English.
`;

const FREE_FLASH_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-latest",
];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const rawKey = process.env.GEMINI_API_KEY;
    const apiKey = rawKey ? rawKey.trim() : null;

    if (apiKey) {
      for (const model of FREE_FLASH_MODELS) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `${SYSTEM_PROMPT}\n\nCustomer Message: ${message}`,
                      },
                    ],
                  },
                ],
              }),
            }
          );

          const data = await response.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (replyText) {
            return NextResponse.json({ reply: replyText });
          }

          if (data?.error) {
            console.error(`Gemini [${model}] error:`, data.error.message);
          }
        } catch (fetchErr) {
          console.error(`Fetch failed on ${model}:`, fetchErr);
        }
      }
    }

    // স্মার্ট ফলব্যাক রেসপন্স (সার্ভার ডিলে হলেও বায়ার মার্জিত উত্তর পাবে)
    const lower = message.toLowerCase();
    let safeReply =
      "Hello! Welcome to Inskeys Support Desk. How can I assist you today with digital licenses, order fulfillment, or account queries?";

    if (
      lower.includes("how are you") ||
      lower.includes("kemon acho") ||
      lower.includes("কেমন আছেন") ||
      lower.includes("কেমন আছো")
    ) {
      safeReply =
        "I am doing great, thank you! I am here and ready to help you with your Inskeys orders and digital purchases.";
    } else if (
      lower.includes("delivery") ||
      lower.includes("code") ||
      lower.includes("kivabe pabo") ||
      lower.includes("পাবো")
    ) {
      safeReply =
        "Items with Automatic Delivery are sent to your screen immediately upon confirmed payment. Manual delivery orders are dispatched promptly by our merchants.";
    } else if (
      lower.includes("escrow") ||
      lower.includes("protection") ||
      lower.includes("security") ||
      lower.includes("নিরাপত্তা")
    ) {
      safeReply =
        "All transactions are protected by our guaranteed 36-Hour Buyer Protection to ensure complete validity before funds are finalized.";
    } else if (
      lower.includes("contact") ||
      lower.includes("support") ||
      lower.includes("help") ||
      lower.includes("ইমেইল")
    ) {
      safeReply =
        "Our official customer care desk is reachable anytime at contact@inskeys.com.";
    }

    return NextResponse.json({ reply: safeReply });
  } catch (error) {
    console.error("Chat route fatal error:", error);
    return NextResponse.json({
      reply:
        "Welcome to Inskeys! For direct assistance, our support desk is always active at contact@inskeys.com.",
    });
  }
}