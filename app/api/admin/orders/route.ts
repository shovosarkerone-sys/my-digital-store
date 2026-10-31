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

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function trackingUrl(order: any) {
  return `https://inskeys.com/order?order_id=${encodeURIComponent(order.payment_id)}&email=${encodeURIComponent(order.user_email)}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized. Please sign in to the Admin Console." }, { status: 401 });
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("orders")
      .select("id,created_at,user_email,product_id,product_title,amount,currency,payment_status,payment_provider,payment_id,transaction_id,payment_reviewed_at,delivery_type,delivery_content,protection_until")
      .order("created_at", { ascending: false });
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

    // Retry delivery for an already-paid order whose stock was unavailable at checkout.
    if (action === "fulfill") {
      const deliveryType = order.delivery_type || "auto";
      const waiting = ["AUTO_DELIVERY_KEY_READY", "AUTO_DELIVERY_PENDING_STOCK", ""].includes(String(order.delivery_content || ""));
      if (order.payment_status !== "completed" || deliveryType !== "auto" || !waiting) {
        return NextResponse.json({ error: "This order is not waiting for an automatic delivery code." }, { status: 409 });
      }
      if (!order.product_id) return NextResponse.json({ error: "Product reference is missing for this order." }, { status: 409 });
      const { data: product, error: productError } = await supabase.from("products")
        .select("id,voucher_codes,sold_count").eq("id", order.product_id).single();
      if (productError || !product) return NextResponse.json({ error: "Product inventory could not be loaded." }, { status: 409 });
      const codes = String(product.voucher_codes || "").split("\\n").map((code: string) => code.trim()).filter(Boolean);
      if (!codes.length) return NextResponse.json({ error: "No voucher code is in stock. Add a real code to this product, then try again." }, { status: 409 });

      const { error: inventoryError } = await supabase.from("products").update({
        voucher_codes: codes.slice(1).join("\\n"),
        sold_count: Number(product.sold_count || 0) + 1,
      }).eq("id", product.id);
      if (inventoryError) throw inventoryError;

      const deliveryContent = codes[0];
      const { error: updateError } = await supabase.from("orders").update({ delivery_content: deliveryContent }).eq("id", order.id);
      if (updateError) throw updateError;

      const url = trackingUrl(order);
      await sendEmail(order.user_email, `Your product key — ${order.product_title}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0f172a"><h2 style="color:#0284c7">Inskeys</h2><h3>Your digital product key is ready</h3><p>Order reference: <strong>${escapeHtml(order.payment_id)}</strong></p><pre style="padding:16px;background:#f1f5f9;border-radius:8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;color:#0f172a">${escapeHtml(deliveryContent)}</pre><p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#0284c7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">View Order &amp; Copy Key</a></p><p style="color:#64748b;font-size:12px">36-Hour Buyer Protection is active. Contact contact@inskeys.com for help.</p></div>`);
      return NextResponse.json({ success: true, status: "delivered" });
    }

    if (order.payment_provider !== "binance_pay") return NextResponse.json({ error: "Only Binance Pay orders can be manually verified here." }, { status: 400 });
    if (order.payment_status !== "pending") return NextResponse.json({ error: "This order has already been reviewed." }, { status: 409 });

    if (action === "reject") {
      const { error } = await supabase.from("orders").update({
        payment_status: "failed", payment_reviewed_at: new Date().toISOString(),
      }).eq("id", order.id).eq("payment_status", "pending");
      if (error) throw error;
      return NextResponse.json({ success: true, status: "failed" });
    }

    const { data: claimed, error: claimError } = await supabase.from("orders")
      .update({ payment_status: "processing" })
      .eq("id", order.id).eq("payment_status", "pending").select("id").maybeSingle();
    if (claimError || !claimed) return NextResponse.json({ error: "This order is already being reviewed." }, { status: 409 });

    const deliveryType = order.delivery_type || "auto";
    let deliveryContent = deliveryType === "manual"
      ? "Manual delivery: Payment verified. The merchant will fulfill your order shortly."
      : "";
    if (deliveryType === "auto" && order.product_id) {
      const { data: product, error: productError } = await supabase.from("products")
        .select("id,voucher_codes,sold_count").eq("id", order.product_id).single();
      if (productError || !product) {
        await supabase.from("orders").update({ payment_status: "pending" }).eq("id", order.id);
        return NextResponse.json({ error: "Product inventory could not be loaded. Order left pending." }, { status: 409 });
      }
      const codes = String(product.voucher_codes || "").split("\\n").map((code: string) => code.trim()).filter(Boolean);
      if (!codes.length) {
        await supabase.from("orders").update({ payment_status: "pending" }).eq("id", order.id);
        return NextResponse.json({ error: "No voucher code is available. Add stock before approving this order." }, { status: 409 });
      }
      const { error: inventoryError } = await supabase.from("products").update({
        voucher_codes: codes.slice(1).join("\\n"),
        sold_count: Number(product.sold_count || 0) + 1,
      }).eq("id", product.id);
      if (inventoryError) {
        await supabase.from("orders").update({ payment_status: "pending" }).eq("id", order.id);
        throw inventoryError;
      }
      deliveryContent = codes[0];
    } else if (deliveryType === "manual" && order.product_id) {
      const { data: product } = await supabase.from("products").select("sold_count").eq("id", order.product_id).single();
      if (product) await supabase.from("products").update({ sold_count: Number(product.sold_count || 0) + 1 }).eq("id", order.product_id);
    }

    const { error: completeError } = await supabase.from("orders").update({
      payment_status: "completed",
      delivery_content: deliveryContent,
      protection_until: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      payment_reviewed_at: new Date().toISOString(),
    }).eq("id", order.id);
    if (completeError) throw completeError;

    const url = trackingUrl(order);
    const deliveryHtml = deliveryType === "manual"
      ? `<p>Your payment is verified. The seller will fulfill <strong>${escapeHtml(order.product_title)}</strong> shortly.</p>`
      : `<p>Your payment is verified. Your digital product key for <strong>${escapeHtml(order.product_title)}</strong>:</p><pre style="padding:16px;background:#f1f5f9;border-radius:8px;font-family:monospace;white-space:pre-wrap;word-break:break-all;color:#0f172a">${escapeHtml(deliveryContent)}</pre>`;
    await sendEmail(order.user_email, deliveryType === "manual" ? `Order confirmed — ${order.product_title}` : `Your product key — ${order.product_title}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0f172a"><h2 style="color:#0284c7">Inskeys</h2><h3>Payment confirmed</h3><p>Order reference: <strong>${escapeHtml(order.payment_id || String(order.id))}</strong></p>${deliveryHtml}<p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#0284c7;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">View Order &amp; Copy Key</a></p><p style="color:#64748b;font-size:12px">36-Hour Buyer Protection is active. Need help? Contact contact@inskeys.com.</p></div>`);

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
    if (token && chat) {
      const message = `✅ Binance Pay verified\\nOrder: ${order.payment_id}\\nBuyer: ${order.user_email}\\nProduct: ${order.product_title}\\nTransaction: ${order.transaction_id || "—"}`;
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
