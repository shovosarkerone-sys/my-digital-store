import { NextResponse } from "next/server";
import { isValidAdminSession } from "@/lib/admin-session";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient("https://evhwesdmwinemzwnizaf.supabase.co", key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function authorized(req: Request) {
  return isValidAdminSession(req);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized. Please sign in to the Admin Console." }, { status: 401 });
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("orders").select("id,created_at,user_email,product_id,product_title,amount,currency,payment_status,payment_provider,payment_id,transaction_id,payment_reviewed_at,delivery_type,delivery_content,protection_until").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ orders: data || [] });
  } catch (error: any) {
    console.error("Admin orders fetch failed:", error);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized. Please sign in to the Admin Console." }, { status: 401 });
  try {
    const { orderId, action } = await req.json();
    if (!Number.isInteger(Number(orderId)) || !["approve", "reject", "fulfill"].includes(action)) {
      return NextResponse.json({ error: "Invalid order action." }, { status: 400 });
    }
    const supabase = getAdminClient();

    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", Number(orderId)).single();
    if (orderError || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (action === "fulfill") {
      if (order.payment_status !== "completed" || (order.delivery_type || "auto") !== "auto" ||
          !["AUTO_DELIVERY_KEY_READY", "AUTO_DELIVERY_PENDING_STOCK", ""].includes(String(order.delivery_content || ""))) {
        return NextResponse.json({ error: "This order is not waiting for an automatic delivery code." }, { status: 409 });
      }
      if (!order.product_id) return NextResponse.json({ error: "Product reference is missing for this order." }, { status: 409 });
      const { data: product, error: productError } = await supabase.from("products").select("id,voucher_codes,sold_count").eq("id", order.product_id).single();
      if (productError || !product) return NextResponse.json({ error: "Product inventory could not be loaded." }, { status: 409 });
      const codes = String(product.voucher_codes || "").split("\n").map((code: string) => code.trim()).filter(Boolean);
      if (!codes.length) return NextResponse.json({ error: "No voucher code is in stock. Add a real code to this product, then try again." }, { status: 409 });
      const { error: inventoryError } = await supabase.from("products").update({
        voucher_codes: codes.slice(1).join("\n"),
        sold_count: Number(product.sold_count || 0) + 1,
      }).eq("id", product.id);
      if (inventoryError) throw inventoryError;
      const deliveryContent = codes[0];
      const { error: updateError } = await supabase.from("orders").update({ delivery_content: deliveryContent }).eq("id", order.id);
      if (updateError) throw updateError;
      const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const trackingUrl = `https://inskeys.com/order?order_id=${encodeURIComponent(order.payment_id)}&email=${encodeURIComponent(order.user_email)}`;
    const manualDelivery = deliveryType === "manual";
    await sendEmail(order.user_email, manualDelivery ? `Order confirmed — ${order.product_title}` : `Your product key — ${order.product_title}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0f172a"><h2 style="color:#0284c7">Inskeys</h2><h3>Payment confirmed</h3><p>Order reference: <strong>${escapeHtml(order.payment_id || String(order.id))}</strong></p>${manualDelivery
        ? `<p>Your payment is verified. The seller will fulfill <strong>${escapeHtml(order.product_title)}</strong> shortly.</p>`
        : `<p>Your digital product key for <strong>${escapeHtml(order.product_title)}</strong>:</p><pre style="padding:16px;background:#f1f5f9;border-radius:8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;color:#0f172a">${escapeHtml(deliveryContent)}</pre>`}<p><a href="${trackingUrl}" style="display:inline-block;padding:12px 18px;background:#0284c7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">View Order &amp; Copy Key</a></p><p style="color:#64748b;font-size:12px">36-Hour Buyer Protection is active. Need help? Contact contact@inskeys.com.</p></div>`);

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
    if (token && chat) {
      const message = `✅ Binance Pay verified\nOrder: ${order.payment_id}\nBuyer: ${order.user_email}\nProduct: ${order.product_title}\nTransaction: ${order.transaction_id || "—"}`;
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chat, text: message }),
        });
      } catch (err) { console.error("Admin verification notification failed:", err); }
    }
    return NextResponse.json({ success: true, status: "completed" });
  } catch (error: any) {
    console.error("Admin order verification failed:", error);
    return NextResponse.json({ error: "Could not update this order." }, { status: 500 });
  }
}
