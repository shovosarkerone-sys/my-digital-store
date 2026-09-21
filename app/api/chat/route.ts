import { NextResponse } from "next/server";

// এআই-এর রোবোটিক ভাব দূর করার জন্য কড়া নিয়মাবলী
const SYSTEM_PROMPT = `
You are an expert human customer support executive for "Inskeys" (https://inskeys.com) — a trusted digital marketplace for game keys, gift cards, and software licenses.

STRICT TONE & WRITING RULES:
1. Sound 100% human, natural, and direct. You are NOT an AI bot, you are a human support agent.
2. NO MARKDOWN OR ASTERISKS: Never use asterisks (*, **, or bullet stars) in your reply. Always write in clean, plain text.
3. NO EMOJIS: Do not use any emojis at all. Keep it clean and professional.
4. NO REPETITIVE GREETINGS: NEVER say "Thank you for reaching out to us", "Thanks for contacting Inskeys", or repetitive formal greetings in your answers. Answer the customer's question directly.
5. BAN AI BUZZWORDS: Never use words like "seamless", "seamlessly", "including", "delighted", "furthermore", or corporate AI jargon. Use simple, everyday words.
6. SHORT & CONCISE: Keep replies brief (1 to 3 short sentences maximum). Never write long paragraphs.
7. LANGUAGE:
   - If the user asks in Bengali or Banglish, reply in natural, everyday Bengali (যেমন: "পেমেন্ট কনফার্ম হওয়ার কয়েক সেকেন্ডের মধ্যেই কোড আপনার স্ক্রিনে চলে আসবে।").
   - If in English, reply in plain, friendly, conversational English.

STORE FACTS:
- Delivery: Official Store codes are delivered automatically and instantly upon crypto confirmation.
- Escrow Hold: Community seller orders have a 24 to 36-hour safety hold so the buyer can verify the code.
- Support Email: contact@inskeys.com
- Payments: Crypto payments (USDT, BTC, LTC, etc.) processed via Cryptomus.
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
                        text: `${SYSTEM_PROMPT}\n\nCustomer question: ${message}`,
                      },
                    ],
                  },
                ],
              }),
            }
          );

          const data = await response.json();
          let replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (replyText) {
            // যদি কোনো কারণে মডেল স্টার চিহ্ন দিয়েও ফেলে, তা স্বয়ংক্রিয়ভাবে মুছে প্লেইন টেক্সট করে দেবে
            replyText = replyText.replace(/\*/g, "").trim();
            return NextResponse.json({ reply: replyText });
          }
        } catch (fetchErr) {
          console.error(`Fetch failed on ${model}:`, fetchErr);
        }
      }
    }

    // স্মার্ট ফলব্যাক (হিউম্যান স্টাইল)
    const lower = message.toLowerCase();
    let safeReply = "Hello! How can I help you with your Inskeys order today?";

    if (lower.includes("delivery") || lower.includes("code") || lower.includes("kivabe pabo") || lower.includes("পাবো")) {
      safeReply = "Official Store items are delivered instantly to your screen right after crypto payment is confirmed.";
    } else if (lower.includes("escrow") || lower.includes("security") || lower.includes("নিরাপত্তা")) {
      safeReply = "All orders are protected by a 24 to 36-hour escrow hold so you can verify your key before the seller is paid.";
    } else if (lower.includes("contact") || lower.includes("support") || lower.includes("help") || lower.includes("ইমেইল")) {
      safeReply = "You can write directly to our team at contact@inskeys.com anytime.";
    }

    return NextResponse.json({ reply: safeReply });
  } catch (error) {
    console.error("Chat fatal error:", error);
    return NextResponse.json({
      reply: "Please reach out to our support team at contact@inskeys.com for direct assistance.",
    });
  }
}