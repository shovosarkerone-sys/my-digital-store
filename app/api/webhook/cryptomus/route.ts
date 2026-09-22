import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

// টেলিগ্রাম বটের মাধ্যমে তাৎক্ষণিক নোটিফিকেশন পাঠানোর ফাংশন
async function sendTelegramAlert(messageText: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Telegram notification error:", err);
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const data = JSON.parse(rawBody);

    const receivedSign = data.sign;
    const apiKey = process.env.CRYPTOMUS_PAYMENT_KEY;

    if (!receivedSign || !apiKey) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Cryptomus সিগনেচার যাচাই
    const payloadWithoutSign = { ...data };
    delete payloadWithoutSign.sign;

    const payloadJson = JSON.stringify(payloadWithoutSign).replace(/\//g, "\\/");
    const calculatedSign = crypto
      .createHash("md5")
      .update(Buffer.from(payloadJson).toString("base64") + apiKey)
      .digest("hex");

    if (calculatedSign !== receivedSign) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // বায়ার পেমেন্ট সফল করা মাত্র
    if (data.status === "paid" || data.status === "paid_over") {
      const orderId = data.order_id;

      // ১. সংশ্লিষ্ট অর্ডারটি ডাটাবেজ থেকে খুঁজে বের করা
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_id", orderId)
        .maybeSingle();

      if (!orderErr && order && order.payment_status !== "completed") {
        // ২. ৩৬ ঘণ্টার বায়ার সুরক্ষা মেয়াদ নির্ধারণ
        const protectionExpiry = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

        let finalDeliveryContent = order.delivery_content || "";
        const deliveryType = order.delivery_type || "auto";

        // ৩. অটো ডেলিভারি হলে স্টক থেকে লাইসেন্স কি কেটে দেওয়া
        if (deliveryType === "auto" && order.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("id, voucher_codes, sold_count")
            .eq("id", order.product_id)
            .single();

          if (product && product.voucher_codes) {
            const codeList = product.voucher_codes
              .split("\n")
              .map((c: string) => c.trim())
              .filter(Boolean);

            if (codeList.length > 0) {
              const allocatedCode = codeList[0];
              const remainingCodes = codeList.slice(1).join("\n");

              finalDeliveryContent = allocatedCode;

              // প্রোডাক্ট স্টক আপডেট ও সোল্ড কাউন্ট বৃদ্ধি
              await supabase
                .from("products")
                .update({
                  voucher_codes: remainingCodes,
                  sold_count: (product.sold_count || 0) + 1,
                })
                .eq("id", product.id);
            }
          }
        } else if (deliveryType === "manual" && order.product_id) {
          finalDeliveryContent = "🕒 Manual Delivery: The merchant will fulfill your order shortly. Your 36-Hour Buyer Protection is active.";
          
          // প্রোডাক্টের সোল্ড কাউন্ট বাড়ানো
          const { data: prod } = await supabase
            .from("products")
            .select("sold_count")
            .eq("id", order.product_id)
            .single();

          if (prod) {
            await supabase
              .from("products")
              .update({ sold_count: (prod.sold_count || 0) + 1 })
              .eq("id", order.product_id);
          }
        }

        // ৪. অর্ডার কমপ্লিট স্ট্যাটাস এবং ডেলিভারি কনটেন্ট আপডেট
        await supabase
          .from("orders")
          .update({
            payment_status: "completed",
            delivery_content: finalDeliveryContent,
            protection_until: protectionExpiry,
          })
          .eq("id", order.id);

        // ৫. টেলিগ্রাম বটের মাধ্যমে অ্যাডমিন/সেলারকে তাৎক্ষণিক অ্যালার্ট পাঠানো
        const isManual = deliveryType === "manual";
        const telegramMessage = `🛍️ *New Order Confirmed!*\n\n` +
          `📦 *Product:* ${order.product_title}\n` +
          `👤 *Buyer:* ${order.user_email}\n` +
          `💰 *Amount:* $${order.amount} USD\n` +
          `🚚 *Delivery:* ${isManual ? "🕒 Manual Delivery (Action Required)" : "⚡ Automatic Delivery (Delivered)"}\n` +
          `🛡️ *Protection:* 36-Hour Buyer Protection Active\n` +
          `🆔 *Order ID:* \`${order.payment_id}\``;

        await sendTelegramAlert(telegramMessage);
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}