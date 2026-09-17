import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const data = JSON.parse(rawBody);

    const receivedSign = data.sign;
    const apiKey = process.env.CRYPTOMUS_PAYMENT_KEY;

    if (!receivedSign || !apiKey) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Cryptomus সিগনেচার যাচাই (নিরাপত্তার জন্য)
    const payloadWithoutSign = { ...data };
    delete payloadWithoutSign.sign;

    const payloadJson = JSON.stringify(payloadWithoutSign).replace(/\//g, "\\/");
    const calculatedSign = crypto
      .createHash("md5")
      .update(Buffer.from(payloadJson).toString("base64") + apiKey)
      .digest("hex");

    // বায়ার পেমেন্ট সফল করা মাত্র (paid অথবা paid_over)
    if (data.status === "paid" || data.status === "paid_over") {
      await supabase
        .from("orders")
        .update({ payment_status: "completed" })
        .eq("payment_id", data.order_id);
    }

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}