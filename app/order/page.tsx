"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
type Order = { payment_id: string; product_title: string; amount: number; currency: string | null; payment_status: string; delivery_type: string | null; delivery_content: string | null; created_at: string; };
export default function GuestOrderLookupPage() {
  const [orderId, setOrderId] = useState(""); const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null); const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); const [copied, setCopied] = useState(false);
  async function lookup(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setOrder(null);
    try {
      const response = await fetch("/api/order/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, email }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Order not found.");
      setOrder(result.order);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not look up your order."); }
    finally { setLoading(false); }
  }
  async function copyKey() {
    if (!order?.delivery_content) return;
    await navigator.clipboard.writeText(order.delivery_content); setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }
  const completed = order?.payment_status === "completed"; const manual = order?.delivery_type === "manual";
  const waitingForCode = order?.delivery_content === "AUTO_DELIVERY_KEY_READY" || order?.delivery_content === "AUTO_DELIVERY_PENDING_STOCK";
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-12">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="block text-center text-2xl font-black mb-8">Inskeys</Link>
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
          <h1 className="text-2xl font-black">My Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">Track a purchase without creating an account. Enter the order reference and the email used at checkout.</p>
          <form onSubmit={lookup} className="space-y-4">
            <label className="block text-xs font-bold">Order Reference
              <input value={orderId} onChange={e => setOrderId(e.target.value)} required placeholder="e.g. ORDER_..." className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </label>
            <label className="block text-xs font-bold">Purchase Email
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </label>
            <button disabled={loading} className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold text-sm py-3">{loading ? "Checking..." : "Find My Order"}</button>
          </form>
          {error && <p className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-600">{error}</p>}
          {order && <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex justify-between gap-3"><h2 className="font-bold">{order.product_title}</h2><span className="text-xs font-mono">{"$" + order.amount + " " + (order.currency || "USD")}</span></div>
            <p className="text-xs text-slate-500 break-all">Reference: {order.payment_id}</p>
            <p className="text-sm">Status: <strong className={completed ? "text-emerald-500" : order.payment_status === "failed" ? "text-rose-500" : "text-amber-500"}>{order.payment_status.toUpperCase()}</strong></p>
            {completed && manual ? <p className="text-sm text-amber-600">Payment verified. Your seller is preparing the manual delivery.</p> : completed && waitingForCode ? <p className="text-sm text-amber-600">Payment confirmed. Your digital code is awaiting stock allocation. We will email you when it is ready.</p> : completed ? <div className="space-y-2"><div className="text-xs font-bold text-emerald-600">Your Digital Product Key</div><pre className="whitespace-pre-wrap break-all rounded-xl bg-slate-100 dark:bg-slate-950 p-4 text-sm font-mono">{order.delivery_content}</pre><button type="button" onClick={copyKey} className="rounded-lg bg-sky-500 text-white px-4 py-2 text-xs font-bold">{copied ? "Copied!" : "Copy Key"}</button></div> : <p className="text-sm text-slate-500">Your order is awaiting payment verification. Refresh this page later to check again.</p>}
          </div>}
        </section>
        <Link href="/" className="block text-center text-sm text-sky-600 mt-6">← Back to Store</Link>
      </div>
    </main>
  );
}