import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { productId, buyerEmail } = await req.json();

    const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
    const apiKey = process.env.CRYPTOMUS_PAYMENT_KEY || process.env.CRYPTOMUS_API_KEY;

    if (!merchantId || !apiKey) {
      return NextResponse.json(
        { error: "Cryptomus keys are missing in Vercel environment variables!" },
        { status: 500 }
      );
    }

    if (!productId || !buyerEmail) {
      return NextResponse.json(
        { error: "Product ID and Email are required" },
        { status: 400 }
      );
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

    // ২. প্রাইস নির্ধারণ
    const finalAmount =
      product.discount_price && product.discount_price < product.price
        ? product.discount_price
        : product.price;

    const orderId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inskeys.com";

    // ৩. orders টেবিলে pending অর্ডার এন্ট্রি
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
      delivery_content: product.description || "Thank you for your purchase from Inskeys!",
    });

    // ৪. Cryptomus পেলোড (Alphabetical order এ সাজানো)
    const payload = {
      amount: Number(finalAmount).toFixed(2),
      currency: "USD",
      order_id: orderId,
      url_callback: `${siteUrl}/api/webhook/cryptomus`,
      url_return: `${siteUrl}/order/success?order_id=${orderId}`,
    };

    // স্ল্যাশ স্কেপিং ঠিক করার জন্য .replace() যুক্ত করা হয়েছে
    const payloadJson = JSON.stringify(payload).replace(/\\\//g, "/");
    const base64Payload = Buffer.from(payloadJson).toString("base64");

    // ৫. MD5 সিগনেচার তৈরি
    const sign = crypto
      .createHash("md5")
      .update(base64Payload + apiKey)
      .digest("hex");

    // ৬. Cryptomus API কল
    const res = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: merchantId,
        sign: sign,
      },
      body: JSON.stringify({ data: base64Payload }),
    });

    const data = await res.json();
    console.log("Cryptomus Full Response:", data);

    if (data.state === 0 && data.result?.url) {
      return NextResponse.json({ checkoutUrl: data.result.url });
    } else {
      return NextResponse.json(
        { error: data.message || "Failed to initialize payment invoice" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Checkout route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}