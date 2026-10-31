import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const { orderId, email } = await req.json();
    const paymentId = String(orderId || "").trim();
    const buyerEmail = String(email || "").trim().toLowerCase();
    if (!paymentId || !buyerEmail.includes("@") || paymentId.length > 120) return NextResponse.json({ error: "Enter a valid order reference and purchase email." }, { status: 400 });
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return NextResponse.json({ error: "Order lookup is temporarily unavailable." }, { status: 500 });
    const supabase = createClient("https://evhwesdmwinemzwnizaf.supabase.co", key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await supabase.from("orders").select("payment_id,user_email,product_title,amount,currency,payment_status,delivery_type,delivery_content,created_at").eq("payment_id", paymentId).ilike("user_email", buyerEmail).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "No order matched that reference and email." }, { status: 404 });
    return NextResponse.json({ order: data });
  } catch (error) {
    console.error("Guest order lookup failed:", error);
    return NextResponse.json({ error: "Could not look up this order. Please try again." }, { status: 500 });
  }
}