import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are a human customer support executive for "Inskeys" (https://inskeys.com) — a trusted digital marketplace for game keys, gift cards, and software licenses.

STRICT WRITING RULES:
1. Speak naturally like a real human support specialist.
2. NO MARKDOWN OR ASTERISKS: Never use * or ** in your reply. Plain text only.
3. NO EMOJIS: Do not use any emojis.
4. NO REPETITIVE GREETINGS: Do not say "Thank you for contacting Inskeys" or "Thanks for reaching out". Get straight to the answer.
5. NO AI BUZZWORDS: Ban words like "seamless", "seamlessly", "including", "furthermore", "delighted".
6. KEEP IT SHORT: 1 to 3 short sentences maximum.
7. LANGUAGE:
   - If the user writes in Bengali or Banglish, reply warmly in Bengali.
   - If in English, reply in friendly English.

STORE POLICIES:
- Trust & Safety: All purchases are protected by our 24 to 36-hour Escrow Hold. Community sellers are only paid after the buyer verifies the key.
- Instant Fulfillment: Official Store products are delivered automatically to the screen and receipt immediately upon payment confirmation.
- Support Desk: Available 24/7 at contact@inskeys.com.
- Payments: Processed via Cryptomus (USDT, BTC, LTC, etc.).
`;

const PRIMARY_MODEL = "gemini-2.5-flash";
const BACKUP_MODEL = "gemini-flash-latest";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const rawKey = process.env.GEMINI_API_KEY;
    const apiKey = rawKey ? rawKey.trim() : null;

    if (apiKey) {
      const models = [PRIMARY_MODEL, BACKUP_MODEL];

      for (const model of models) {
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
                systemInstruction: {
                  parts: [{ text: SYSTEM_PROMPT }],
                },
                contents: [
                  {
                    role: "user",
                    parts: [{ text: message }],
                  },
                ],
                generationConfig: {
                  maxOutputTokens: 250,
                  temperature: 0.7,
                },
              }),
            }
          );

          const data = await response.json();
          let replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (replyText) {
            replyText = replyText.replace(/\*/g, "").trim();
            return NextResponse.json({ reply: replyText });
          }
        } catch (fetchErr) {
          console.error(`Error calling ${model}:`, fetchErr);
        }
      }
    }

    // স্মার্ট হিউম্যান ফলব্যাক (যদি গুগলের ফ্রি রেট লিমিট হয়, তখনো বায়ার বাস্তবসম্মত উত্তর পাবে)
    const lower = message.toLowerCase();
    let safeReply = "I am here to assist you with anything regarding your Inskeys orders and digital keys. How can I help?";

    if (
      lower.includes("trust") ||
      lower.includes("scam") ||
      lower.includes("fake") ||
      lower.includes("safe") ||
      lower.includes("legit") ||
      lower.includes("বিশ্বাস") ||
      lower.includes("প্রতারণা")
    ) {
      safeReply =
        "Your purchase is completely safe with us. We use a 24 to 36-hour Escrow Protection system, meaning the seller never gets paid until you confirm your key works perfectly.";
    } else if (
      lower.includes("how are you") ||
      lower.includes("kemon acho") ||
      lower.includes("কেমন আছেন") ||
      lower.includes("কেমন আছো")
    ) {
      safeReply =
        "I am doing great, thank you! Ready to assist you with any questions about our keys or platform.";
    } else if (
      lower.includes("delivery") ||
      lower.includes("code") ||
      lower.includes("key") ||
      lower.includes("kivabe pabo") ||
      lower.includes("পাবো")
    ) {
      safeReply =
        "Official Store items are delivered instantly right to your screen and order history as soon as crypto payment is confirmed.";
    } else if (
      lower.includes("escrow") ||
      lower.includes("protection") ||
      lower.includes("নিরাপত্তা")
    ) {
      safeReply =
        "Every order is secured by our escrow hold to ensure your key is valid and working before funds are released.";
    } else if (
      lower.includes("contact") ||
      lower.includes("support") ||
      lower.includes("email") ||
      lower.includes("human") ||
      lower.includes("ইমেইল")
    ) {
      safeReply =
        "You can directly reach our official human support team anytime at contact@inskeys.com.";
    }

    return NextResponse.json({ reply: safeReply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({
      reply: "For direct assistance, our team is always active at contact@inskeys.com.",
    });
  }
}