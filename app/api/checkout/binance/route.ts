import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return NextResponse.json({ error: "Checkout is temporarily unavailable. Please contact support." }, { status: 500 });

    const { productId, buyerEmail, transactionId } = await req.json();
    const email = String(buyerEmail || "").trim().toLowerCase();
    const txid = String(transactionId || "").trim();

    if (!productId || !email.includes("@") || txid.length < 5 || txid.length > 180) {
      return NextResponse.json({ error: "Please provide a valid email and Binance Pay transaction ID." }, { status: 400 });
    }

    const supabase = createClient("https://evhwesdmwinemzwnizaf.supabase.co", serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: product, error: productError } = await supabase.from("products").select("*").eq("id", productId).single();
    if (productError || !product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const hasActiveDiscount = product.discount_price && product.discount_price < product.price &&
      (!product.discount_until || new Date(product.discount_until).getTime() > Date.now());
    const amount = Number(hasActiveDiscount ? product.discount_price : product.price);
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Invalid product price." }, { status: 400 });

    const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const { error: insertError } = await supabase.from("orders").insert({
      user_email: email,
      product_id: product.id,
      product_title: product.title,
      amount,
      currency: "USD",
      payment_status: "pending",
      payment_provider: "binance_pay",
      payment_id: orderId,
      transaction_id: txid,
      delivery_type: product.delivery_type || "auto",
      delivery_content: product.description || "Awaiting payment verification.",
    });
    if (insertError) {
      console.error("Binance Pay order insert failed:", insertError);
      return NextResponse.json({ error: "We could not record your order. Please contact support before submitting again." }, { status: 500 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
    if (token && chat) {
      const message = `🟡 <b>Binance Pay verification required</b>\n\n<b>Product:</b> ${product.title}\n<b>Amount:</b> $${amount.toFixed(2)} USD\n<b>Buyer:</b> ${email}\n<b>Order ID:</b> #${orderId}\n<b>Transaction ID:</b> <code>${txid.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>\n<b>Status:</b> Pending manual verification`;
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chat, text: message, parse_mode: "HTML" }),
        });
      } catch (notificationError) {
        console.error("Binance Pay Telegram notification failed:", notificationError);
      }
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("Binance Pay checkout error:", error);
    return NextResponse.json({ error: "Could not submit the payment details. Please try again." }, { status: 500 });
  }
}
