import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { productId, buyerEmail } = await req.json();

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

    // ২. ডিসকাউন্ট থাকলে অফার প্রাইস নির্ধারণ
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

    // ৪. Cryptomus পেমেন্ট পেলোড ও সিগনেচার তৈরি
    const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
    const apiKey = process.env.CRYPTOMUS_PAYMENT_KEY;

    // যদি পেমেন্ট কি না থাকে, তবে ডেভেলপার ফ্রেন্ডলি মেসেজ দেবে
    if (!merchantId || !apiKey) {
      return NextResponse.json(
        {
          error:
            "Payment gateway is being configured. Please contact support at contact@inskeys.com",
        },
        { status: 503 }
      );
    }

    const payload = {
      amount: String(finalAmount),
      currency: "USD",
      order_id: orderId,
      url_return: `${siteUrl}/order/success?order_id=${orderId}`,
      url_callback: `${siteUrl}/api/webhook/cryptomus`,
      is_payment_multiple: false,
      lifetime: 3600,
    };

    const payloadJson = JSON.stringify(payload);
    const sign = crypto
      .createHash("md5")
      .update(Buffer.from(payloadJson).toString("base64") + apiKey)
      .digest("hex");

    // ৫. Cryptomus API কল
    const res = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: merchantId,
        sign: sign,
      },
      body: payloadJson,
    });

    const data = await res.json();

    if (data.state === 0 && data.result?.url) {
      return NextResponse.json({ checkoutUrl: data.result.url });
    } else {
      console.error("Cryptomus Error:", data);
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