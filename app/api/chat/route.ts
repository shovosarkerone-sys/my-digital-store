import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the official Customer Concierge and Support Executive for "Inskeys" (https://inskeys.com) — a verified digital marketplace for software licenses, gift cards, game keys, and automated vouchers.

Platform facts:
1. Delivery: "Official Store" items are delivered automatically and instantly upon crypto payment confirmation.
2. Escrow: Community seller orders have a 24 to 36-hour escrow protection hold to verify code validity before merchant payout.
3. Official Support Email: contact@inskeys.com
4. Payments: Processed securely via Cryptomus (BTC, USDT, LTC, etc.).
5. Strict Policy: Anti-circumvention policy strictly forbids exchanging external contact info.

Capabilities & Instructions:
- Answer ANY customer question intelligently, concisely, and helpfully (digital key activation, gaming, store policies, or general conversation).
- Always maintain a polite, premium, and trustworthy merchant tone.
- Never show internal technical details, model names, or server errors to the buyer.
- If the user writes in Bengali or Banglish, reply warmly in Bengali. If in English, reply in English.
`;

// গুগলের ১০০% ফ্রি ফ্ল্যাশ মডেলের তালিকা (কোনো পেইড প্রো মডেল নেই)
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

    // যদি API Key থাকে, ফ্রি মডেলগুলো থেকে লাইভ উত্তর আনার চেষ্টা করবে
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

          // উত্তর পাওয়া গেলে বায়ারকে পাঠিয়ে দেবে
          if (replyText) {
            return NextResponse.json({ reply: replyText });
          }

          // এরর হলে ব্যাকএন্ডে লগ রাখবে, বায়ার কিছুই দেখবে না
          if (data?.error) {
            console.error(`Gemini [${model}] error:`, data.error.message);
          }
        } catch (fetchErr) {
          console.error(`Fetch failed on ${model}:`, fetchErr);
        }
      }
    }

    // স্মার্ট ফলব্যাক: কোনো কারণে গুগলের সংযোগে বিলম্ব হলে বায়ার এই মার্জিত উত্তরটি পাবে
    const lower = message.toLowerCase();
    let safeReply =
      "Hello! Welcome to Inskeys Support Desk. How can I assist you today with digital licenses, instant delivery, or account queries?";

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
        "Verified purchases are delivered automatically within seconds upon confirmed payment. Your license key will appear right on your screen and order receipt.";
    } else if (
      lower.includes("escrow") ||
      lower.includes("security") ||
      lower.includes("নিরাপত্তা")
    ) {
      safeReply =
        "All transactions are protected by our 24–36 hour Escrow Hold to guarantee code validity before funds are released to community sellers.";
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