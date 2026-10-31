import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

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
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const supabase = createClient(
      "https://evhwesdmwinemzwnizaf.supabase.co",
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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
        const protectionExpiry = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
        const deliveryType = order.delivery_type || "auto";
        const isManual = deliveryType === "manual";
        let finalDeliveryContent = isManual
          ? "Manual delivery: Payment confirmed. The merchant will fulfill your order shortly."
          : "";

        if (!isManual && order.product_id) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("id,voucher_codes,sold_count")
            .eq("id", order.product_id)
            .single();
          const codeList = String(product?.voucher_codes || "").split("\n").map((code: string) => code.trim()).filter(Boolean);
          if (!productError && product && codeList.length > 0) {
            finalDeliveryContent = codeList[0];
            const { error: inventoryError } = await supabase.from("products").update({
              voucher_codes: codeList.slice(1).join("\n"),
              sold_count: Number(product.sold_count || 0) + 1,
            }).eq("id", product.id);
            if (inventoryError) throw inventoryError;
          } else {
            // Payment is confirmed, but never pretend a placeholder or product description is a key.
            finalDeliveryContent = "AUTO_DELIVERY_KEY_READY";
            console.error("Payment confirmed but no automatic delivery code is in stock for order:", order.payment_id);
            await sendTelegramAlert(`STOCK ALERT: Paid order ${order.payment_id} for ${order.product_title} has no voucher code in stock. Add a code, then use Fulfill Delivery in Admin Orders.`);
          }
        } else if (isManual && order.product_id) {
          const { data: prod } = await supabase.from("products").select("sold_count").eq("id", order.product_id).single();
          if (prod) await supabase.from("products").update({ sold_count: Number(prod.sold_count || 0) + 1 }).eq("id", order.product_id);
        }

        const { error: updateError } = await supabase.from("orders").update({
          payment_status: "completed",
          delivery_content: finalDeliveryContent,
          protection_until: protectionExpiry,
        }).eq("id", order.id);
        if (updateError) throw updateError;

        const safe = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const trackingUrl = `https://inskeys.com/order?order_id=${encodeURIComponent(order.payment_id)}&email=${encodeURIComponent(order.user_email)}`;
        const deliveryHtml = isManual
          ? `<p>Your payment for <strong>${safe(order.product_title)}</strong> is confirmed. This item requires manual delivery; the seller will send the activation details shortly.</p>`
          : finalDeliveryContent === "AUTO_DELIVERY_KEY_READY"
            ? `<p>Your payment is confirmed, but the digital code is temporarily awaiting stock allocation. We will email you again as soon as it is ready. You can check your order status here.</p>`
            : `<p>Your payment for <strong>${safe(order.product_title)}</strong> is confirmed. Your digital key:</p><pre style="padding:16px;background:#f1f5f9;border-radius:8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;color:#0f172a">${safe(finalDeliveryContent)}</pre><p>Open your order page to copy the key.</p>`;
        await sendEmail(order.user_email, isManual || finalDeliveryContent === "AUTO_DELIVERY_KEY_READY" ? `Order update — ${order.product_title}` : `Your product key — ${order.product_title}`,
          `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0f172a"><h2 style="color:#0284c7">Inskeys</h2><h3>Payment confirmed</h3><p>Order reference: <strong>${safe(order.payment_id)}</strong></p>${deliveryHtml}<p><a href="${trackingUrl}" style="display:inline-block;padding:12px 18px;background:#0284c7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">View Order &amp; Copy Key</a></p><p style="color:#64748b;font-size:12px">36-Hour Buyer Protection is active. Need help? Contact contact@inskeys.com.</p></div>`);

        const telegramMessage = `🛍️ *New Order Confirmed!*\n\n` +
          `📦 *Product:* ${order.product_title}\n` +
          `👤 *Buyer:* ${order.user_email}\n` +
          `💰 *Amount:* $${order.amount} USD\n` +
          `🚚 *Delivery:* ${isManual ? "Manual Delivery" : finalDeliveryContent === "AUTO_DELIVERY_KEY_READY" ? "Payment confirmed — code pending stock" : "Automatic Delivery completed"}\n` +
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