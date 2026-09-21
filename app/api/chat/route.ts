import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the official Customer Concierge and Support Executive for "Inskeys" (https://inskeys.com).
Platform facts:
1. Delivery: "Official Store" items are delivered automatically and instantly upon crypto payment confirmation.
2. Escrow: Community seller orders have a 24 to 36-hour escrow protection hold.
3. Official Support Email: contact@inskeys.com
4. Payments: Processed via Cryptomus (BTC, USDT, LTC, etc.).
Capabilities: Answer any question politely and concisely. If in Bengali/Banglish, reply in Bengali. If in English, reply in English.
`;

// গুগলের বিভিন্ন মডেলের তালিকা
const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: "Error: GEMINI_API_KEY পাওয়া যায়নি। Vercel-এ কি সেট করে Redeploy করুন।",
      });
    }

    let lastError = "";

    // একের পর এক মডেল ট্রাই করবে যতক্ষণ না কাজ করে
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return NextResponse.json({
            reply: data.candidates[0].content.parts[0].text,
          });
        }

        if (data?.error?.message) {
          lastError = `[${model}]: ${data.error.message}`;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    // যদি কোনো মডেলই কাজ না করে, তখন গুগল অনুমোদিত মডেল লিস্ট এনে চ্যাটে দেখাবে
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const listData = await listRes.json();

    if (listData?.models) {
      const available = listData.models
        .map((m: any) => m.name.replace("models/", ""))
        .join(", ");
      return NextResponse.json({
        reply: `গুগলে আপনার জন্য সচল মডেলসমূহ: ${available}`,
      });
    }

    return NextResponse.json({
      reply: `Gemini Error: ${lastError || "API Key বা মডেলে সমস্যা রয়েছে"}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { reply: `Server Error: ${err.message}` },
      { status: 200 }
    );
  }
}