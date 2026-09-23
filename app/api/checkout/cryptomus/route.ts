import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { productId, buyerEmail } = await req.json();

    const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
    const apiKey = process.env.CRYPTOMUS_PAYMENT_KEY || process.env.CRYPTOMUS_API_KEY;

    if (!merchantId || !apiKey) {
      return NextResponse.json({ error: "Cryptomus keys are missing!" }, { status: 500 });
    }

    // ১. প্রোডাক্ট ডেটা সংগ্রহ
    const { data: product, error: prodError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const finalAmount = product.discount_price && product.discount_price < product.price
        ? product.discount_price
        : product.price;

    const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inskeys.com";

    // ২. Database এ অর্ডার সেভ করা
    await supabase.from("orders").insert({
      user_email: buyerEmail.trim(),
      product_id: product.id,
      product_title: product.title,
      amount: finalAmount,
      currency: "USD",
      payment_status: "pending",
      payment_provider: "cryptomus",
      payment_id: orderId,
      delivery_type: product.delivery_type || "auto",
      delivery_content: product.description || "Thank you for your purchase!",
    });

    // ৩. Cryptomus কে যে তথ্যগুলো পাঠাবো
    const payload = {
      amount: Number(finalAmount).toFixed(2),
      currency: "USD",
      order_id: orderId,
      url_callback: `${siteUrl}/api/webhook/cryptomus`,
      url_return: `${siteUrl}/order/success?order_id=${orderId}`,
    };

    // ৪. তথ্যের উপর ভিত্তি করে সিগনেচার তৈরি করা (একদম Cryptomus এর নিয়ম অনুযায়ী)
    const payloadJson = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadJson).toString("base64");
    const sign = crypto.createHash("md5").update(base64Payload + apiKey).digest("hex");

    // ৫. সার্ভারে রিকোয়েস্ট পাঠানো (এখানেই আগেরবার ভুল ছিল, এবার ঠিক করা হয়েছে!)
    const res = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: merchantId,
        sign: sign,
      },
      body: payloadJson, // আগে আমরা ভুল করে JSON.stringify({ data: base64Payload }) পাঠাচ্ছিলাম!
    });

    const data = await res.json();
    console.log("Cryptomus Response:", data);

    if (data.state === 0 && data.result?.url) {
      return NextResponse.json({ checkoutUrl: data.result.url });
    } else {
      return NextResponse.json({ error: data.message || "Payment Failed" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Checkout route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}