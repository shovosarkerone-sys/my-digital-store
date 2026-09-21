import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the official Customer Concierge and Support Executive for "Inskeys" (https://inskeys.com) — a verified digital marketplace for software licenses, gift cards, game keys, and automated vouchers.

Platform facts:
1. Delivery: "Official Store" items are delivered automatically and instantly upon crypto payment confirmation.
2. Escrow: Community seller orders have a 24 to 36-hour escrow protection hold to verify code validity before merchant payout.
3. Official Support Email: contact@inskeys.com
4. Payments: Processed securely via Cryptomus (BTC, USDT, LTC, etc.).
5. Strict Policy: Anti-circumvention policy strictly forbids exchanging external contact info.

Capabilities:
- Answer any customer inquiry politely, helpfully, and concisely (gaming keys, activation guides, technical questions, or general conversation).
- If the user writes in Bengali or Banglish, reply warmly in Bengali. If in English, reply in English.
`;

// তোমার গুগল একাউন্টে যে মডেলগুলো লাইভ আছে
const ACTIVE_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-pro-latest",
];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const rawKey = process.env.GEMINI_API_KEY;
    const apiKey = rawKey ? rawKey.trim() : null;

    if (!apiKey) {
      return NextResponse.json({
        reply: "Error: GEMINI_API_KEY পাওয়া যায়নি। Vercel Settings থেকে key সেট করে Redeploy করুন।",
      });
    }

    let lastErrorMessage = "";

    // সচল মডেলগুলো একের পর এক চেষ্টা করবে
    for (const model of ACTIVE_MODELS) {
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

        // সফল উত্তর পেলে সাথে সাথে পাঠিয়ে দেবে
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return NextResponse.json({ reply: replyText });
        }

        if (data?.error?.message) {
          lastErrorMessage = `[${model}]: ${data.error.message}`;
        }
      } catch (err: any) {
        lastErrorMessage = err.message;
      }
    }

    // কোনো মডেলই কাজ না করলে আসল সমস্যাটি দেখাবে
    return NextResponse.json({
      reply: `AI Connection Issue: ${lastErrorMessage || "Google এআই রেসপন্স দিতে পারছে না, API Key বা কোটা চেক করুন।"}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { reply: `Server Exception: ${error.message}` },
      { status: 200 }
    );
  }
}