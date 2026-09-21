import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the official Customer Concierge and Support Executive for "Inskeys" (https://inskeys.com) — a verified digital marketplace for software licenses, gift cards, game keys, and automated vouchers.

Platform facts:
1. Delivery: "Official Store" items are delivered automatically and instantly upon crypto payment confirmation.
2. Escrow: Community seller orders have a 24 to 36-hour escrow protection hold to verify code validity before merchant payout.
3. Official Support Email: contact@inskeys.com
4. Payments: Processed securely via Cryptomus (BTC, USDT, LTC, etc.).
5. Strict Policy: Anti-circumvention policy forbids exchanging external contact info (WhatsApp, Telegram, personal email).

Capabilities & Instructions:
- Answer ANY customer question intelligently, whether it is about Inskeys, digital key activation, gaming platforms (Steam, PlayStation, Xbox), technical troubleshooting, or general queries.
- Maintain a polite, professional, concise, and trustworthy merchant tone.
- If the user writes in Bengali or Banglish, reply warmly and naturally in Bengali. If in English, reply in English.
`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Gemini API Key থাকলে সরাসরি জেমিনাই লাইভ রেসপন্স দেবে
    if (apiKey) {
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
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        return NextResponse.json({ reply });
      }
    }

    // স্মার্ট ফলব্যাক রেসপন্স (API Key কোনো কারণে সংযোগ না পেলে এটি উত্তর দেবে)
    const lower = message.toLowerCase();
    let smartReply =
      "Welcome to Inskeys! For direct assistance, our official support desk is reachable at contact@inskeys.com. How can I help you today?";

    if (
      lower.includes("delivery") ||
      lower.includes("code") ||
      lower.includes("kivabe pabo") ||
      lower.includes("পাবো")
    ) {
      smartReply =
        "Orders from our Official Store are delivered automatically within seconds upon confirmed crypto payment. You can view your code directly on your screen and order history.";
    } else if (
      lower.includes("escrow") ||
      lower.includes("security") ||
      lower.includes("নিরাপত্তা")
    ) {
      smartReply =
        "We protect all buyer purchases with a 24–36 hour Escrow Hold. The seller only receives funds once you have verified that your digital code works seamlessly.";
    } else if (
      lower.includes("seller") ||
      lower.includes("bikri") ||
      lower.includes("বিক্রি")
    ) {
      smartReply =
        "You can start selling by clicking 'Become a Seller' in the footer menu! Once approved, you can list codes and manage inventory directly from your Seller Dashboard.";
    } else if (
      lower.includes("support") ||
      lower.includes("contact") ||
      lower.includes("help") ||
      lower.includes("ইমেইল")
    ) {
      smartReply =
        "You can reach our official support desk at contact@inskeys.com. We typically respond within 15–30 minutes.";
    } else if (
      lower.includes("payment") ||
      lower.includes("crypto") ||
      lower.includes("টাকা")
    ) {
      smartReply =
        "We accept secure cryptocurrency payments (USDT, Bitcoin, LTC, etc.) powered by Cryptomus for instant, zero-fraud processing.";
    }

    return NextResponse.json({ reply: smartReply });
  } catch {
    return NextResponse.json(
      {
        reply:
          "Hello! For any immediate help or order inquiries, please email our support desk at contact@inskeys.com.",
      },
      { status: 200 }
    );
  }
}