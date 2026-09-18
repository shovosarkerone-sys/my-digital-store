import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the Official AI Customer Support Assistant for "ShovoStore" - a premium P2P and Official Store digital marketplace for game codes, vouchers, and licenses.
Key platform facts:
1. Delivery: "Official Store" items are delivered instantly via automated system upon crypto payment confirmation.
2. Escrow: Community seller orders have a 24 to 36-hour escrow protection hold to verify code validity before payout.
3. Official Support Email: shovosarkerone@gmail.com
4. Payments: Processed securely via Cryptomus (BTC, USDT, LTC, etc.).
5. Strict Policy: Anti-circumvention policy forbids exchanging external contact info (WhatsApp, Telegram, Email). Violation incurs a $100 fine or permanent ban.
Tone: Professional, helpful, concise, friendly. If the user writes in Bengali or Banglish, reply in Bengali. If in English, reply in English.
`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // যদি Gemini API Key কনফিগার করা থাকে, তবে লাইভ জেমিনাই কল হবে
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

    // স্মার্ট ফলব্যাক রেসপন্স (API Key ছাড়া থাকলেও সাধারণ সব উত্তর স্বয়ংক্রিয়ভাবে দেবে)
    const lower = message.toLowerCase();
    let smartReply = "Welcome to ShovoStore! For direct human assistance, our official support email is shovosarkerone@gmail.com. How can I help you today?";

    if (lower.includes("delivery") || lower.includes("code") || lower.includes("kivabe pabo") || lower.includes("পাবো")) {
      smartReply = "Orders from our Official Store are delivered automatically within seconds upon confirmed crypto payment. You will view your code directly on your screen and order history.";
    } else if (lower.includes("escrow") || lower.includes("security") || lower.includes("নিরাপত্তা")) {
      smartReply = "We protect all buyer purchases with a 24–36 hour Escrow Hold. The seller only receives funds once you have verified that your digital code works seamlessly.";
    } else if (lower.includes("seller") || lower.includes("bikri") || lower.includes("বিক্রি")) {
      smartReply = "You can easily start selling by clicking 'Become a Seller' in the top menu! Once registered, you can list codes and manage inventory from your Seller Dashboard.";
    } else if (lower.includes("support") || lower.includes("contact") || lower.includes("help") || lower.includes("ইমেইল")) {
      smartReply = "You can reach our dedicated support desk at shovosarkerone@gmail.com. We typically respond within 15–30 minutes.";
    } else if (lower.includes("payment") || lower.includes("crypto") || lower.includes("টাকা")) {
      smartReply = "We accept secure cryptocurrency payments (USDT, Bitcoin, LTC, etc.) powered by Cryptomus for instant, zero-fraud processing.";
    }

    return NextResponse.json({ reply: smartReply });
  } catch (error: any) {
    return NextResponse.json(
      { reply: "Hello! For any immediate help or order disputes, please email shovosarkerone@gmail.com." },
      { status: 200 }
    );
  }
}