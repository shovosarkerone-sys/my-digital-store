import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the official Customer Concierge and Support Executive for "Inskeys" (https://inskeys.com) — a verified digital marketplace for software licenses, gift cards, game keys, and automated vouchers.

Platform facts:
1. Delivery: "Official Store" items are delivered automatically and instantly upon crypto payment confirmation.
2. Escrow: Community seller orders have a 24 to 36-hour escrow protection hold to verify code validity before merchant payout.
3. Official Support Email: contact@inskeys.com
4. Payments: Processed securely via Cryptomus (BTC, USDT, LTC, etc.).
5. Strict Policy: Anti-circumvention policy forbids exchanging external contact info.

Capabilities & Instructions:
- Answer ANY customer question intelligently (tech, gaming, activation, or general knowledge).
- Maintain a polite, professional, concise, and trustworthy merchant tone.
- If the user writes in Bengali or Banglish, reply warmly in Bengali. If in English, reply in English.
`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: "Error: GEMINI_API_KEY পাওয়া যায়নি। Vercel-এ কি সেট করে Redeploy করুন।",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser Question: ${message}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data?.error) {
      return NextResponse.json({
        reply: `Gemini Error: ${data.error.message}`,
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      return NextResponse.json({ reply });
    }

    return NextResponse.json({
      reply: "কোনো উত্তর পাওয়া যায়নি, অনুগ্রহ করে আবার চেষ্টা করুন।",
    });
  } catch (err: any) {
    return NextResponse.json(
      { reply: `Server Error: ${err.message}` },
      { status: 200 }
    );
  }
}