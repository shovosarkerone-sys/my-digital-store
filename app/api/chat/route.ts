import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are the official Customer Concierge and Support Executive for "Inskeys" (https://inskeys.com) — a verified digital marketplace for software licenses, gift cards, game keys, and automated vouchers.

Platform facts:
1. Delivery: "Official Store" items are delivered automatically and instantly upon crypto payment confirmation.
2. Escrow: Community seller orders have a 24 to 36-hour escrow protection hold to verify code validity before merchant payout.
3. Official Support Email: contact@inskeys.com
4. Payments: Processed securely via Cryptomus (BTC, USDT, LTC, etc.).
5. Strict Policy: Anti-circumvention policy strictly forbids exchanging external contact info (WhatsApp, Telegram, personal email).

Capabilities & Instructions:
- Answer ANY customer question intelligently (tech, gaming, activation keys, platform guidelines, or general knowledge).
- Maintain a polite, professional, concise, and trustworthy merchant tone.
- Never mention internal technical models, server code, or diagnostic messages to the customer.
- If the user writes in Bengali or Banglish, reply warmly in Bengali. If in English, reply in English.
`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // Apnar Google account-e shochol thaka model-gulo
      const activeModels = ["gemini-2.5-flash", "gemini-flash-latest"];

      for (const model of activeModels) {
        try {
          const res = await fetch(
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
                        text: `${SYSTEM_PROMPT}\n\nCustomer query: ${message}`,
                      },
                    ],
                  },
                ],
              }),
            }
          );

          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (reply) {
            return NextResponse.json({ reply });
          }
        } catch (fetchErr) {
          console.error(`Error with ${model}:`, fetchErr);
        }
      }
    }

    // Smart fallback (kono karone Google AI late hole ba network issue hole buyer eita pabe)
    const lower = message.toLowerCase();
    let reply =
      "Welcome to Inskeys! We provide instant digital keys, automated fulfillment, and secure buyer escrow protection. How can we assist you today?";

    if (
      lower.includes("delivery") ||
      lower.includes("kivabe pabo") ||
      lower.includes("পাবো") ||
      lower.includes("code")
    ) {
      reply =
        "All verified items are delivered automatically and instantly right on your screen and order receipt as soon as payment is confirmed.";
    } else if (
      lower.includes("escrow") ||
      lower.includes("protection") ||
      lower.includes("নিরাপত্তা")
    ) {
      reply =
        "Every transaction is safeguarded by our 24–36 hour Escrow Hold. The seller only receives payment after you have verified your code works.";
    } else if (
      lower.includes("seller") ||
      lower.includes("bikri") ||
      lower.includes("বিক্রি")
    ) {
      reply =
        "You can join as a merchant by clicking 'Become a Seller' in our footer menu to list products on our marketplace.";
    } else if (
      lower.includes("contact") ||
      lower.includes("support") ||
      lower.includes("help") ||
      lower.includes("যোগাযোগ") ||
      lower.includes("email")
    ) {
      reply =
        "Our official customer support desk is available at contact@inskeys.com.";
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      reply:
        "Thank you for contacting Inskeys. Our support team is always active at contact@inskeys.com.",
    });
  }
}