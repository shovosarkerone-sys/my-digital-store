"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  created_at: string;
  user_email: string;
  product_id: number | null;
  product_title: string;
  amount: number;
  currency: string | null;
  payment_status: string | null;
  payment_provider: string;
  payment_id: string;
  transaction_id?: string | null;
  payment_reviewed_at?: string | null;
  delivery_type: "auto" | "manual" | null;
  delivery_content: string | null;
  protection_until: string | null;
}

const statusStyles: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  failed: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  cancelled: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    let secret = sessionStorage.getItem("admin_api_secret");
    if (!secret) {
      secret = window.prompt("Enter the Admin API Secret configured in Vercel:");
      if (!secret) { setLoading(false); return; }
      sessionStorage.setItem("admin_api_secret", secret);
    }
    try {
      const response = await fetch("/api/admin/orders", { headers: { "x-admin-secret": secret } });
      const result = await response.json();
      if (!response.ok) {
        sessionStorage.removeItem("admin_api_secret");
        setError(result.error || "Could not load orders. Check the Admin API Secret.");
        setOrders([]);
      } else {
        setOrders((result.orders || []) as Order[]);
      }
    } catch {
      setError("Could not connect to the orders service.");
      setOrders([]);
    }
    setLoading(false);
  }, []);

  const reviewBinanceOrder = async (orderId: number, action: "approve" | "reject") => {
    const secret = sessionStorage.getItem("admin_api_secret");
    if (!secret) { setError("Admin API Secret is missing. Refresh the page to sign in again."); return; }
    const confirmText = action === "approve"
      ? "Confirm that you checked the Binance Pay transaction and received the exact amount?"
      : "Reject this Binance Pay order?";
    if (!window.confirm(confirmText)) return;
    setError("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ orderId, action }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not update this order.");
        return;
      }
      await fetchOrders();
    } catch {
      setError("Could not connect to the verification service.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("admin_authenticated") !== "true") {
      router.replace("/4517");
      return;
    }
    fetchOrders();
  }, [fetchOrders, router]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || (order.payment_status || "pending").toLowerCase() === statusFilter;
      const searchable = [order.payment_id, order.user_email, order.product_title, String(order.id)];
      const matchesSearch = !term || searchable.some((value) => (value || "").toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const copyOrderId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(value);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setError("Could not copy the order ID. Please copy it manually.");
    }
  };

  const formatDate = (value: string) => new Date(value).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const completedCount = orders.filter((o) => o.payment_status === "completed").length;
  const pendingCount = orders.filter((o) => (o.payment_status || "pending") === "pending").length;
  const revenue = orders.filter((o) => o.payment_status === "completed").reduce((sum, o) => sum + Number(o.amount || 0), 0);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <Link href="/4517" className="text-xs text-sky-600 dark:text-sky-400 hover:underline">← Back to Admin Console</Link>
            <h1 className="text-2xl font-black mt-2">Orders Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review buyer orders, payment status and delivery details.</p>
          </div>
          <button onClick={fetchOrders} disabled={loading} className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-bold transition">
            {loading ? "Refreshing..." : "↻ Refresh Orders"}
          </button>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs text-slate-500">Total Orders</p><p className="text-2xl font-black mt-1">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs text-slate-500">Awaiting Payment</p><p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs text-slate-500">Completed Payments · Revenue</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount} <span className="text-sm font-bold">· ${revenue.toFixed(2)}</span></p>
          </div>
        </section>

        <section className="flex flex-col sm:flex-row gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search buyer email, product or order ID..." className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-sky-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:border-sky-500">
            <option value="all">All statuses</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option>
          </select>
        </section>

        {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-600">{error}</div>}

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📦</div><h2 className="font-bold">{orders.length === 0 ? "No orders yet" : "No matching orders"}</h2>
              <p className="text-sm text-slate-500 mt-2">{orders.length === 0 ? "New buyer checkouts will appear here automatically." : "Try another search term or status filter."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[850px]">
                <thead className="bg-slate-100 dark:bg-slate-800/70 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr><th className="p-4">Order / Date</th><th className="p-4">Buyer</th><th className="p-4">Product</th><th className="p-4">Amount</th><th className="p-4">Payment</th><th className="p-4">Details</th></tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const status = (order.payment_status || "pending").toLowerCase();
                    return (
                      <React.Fragment key={order.id}>
                        <tr className="border-t border-slate-100 dark:border-slate-800 align-top">
                          <td className="p-4">
                            <button onClick={() => copyOrderId(order.payment_id)} className="font-mono text-xs text-sky-600 dark:text-sky-400 hover:underline text-left break-all">{copiedId === order.payment_id ? "Copied!" : (order.payment_id || ("#" + order.id))}</button>
                            <p className="text-[11px] text-slate-500 mt-1">{formatDate(order.created_at)}</p>
                          </td>
                          <td className="p-4 text-xs break-all">{order.user_email}</td>
                          <td className="p-4"><p className="font-semibold">{order.product_title}</p><p className="text-[11px] text-slate-500 mt-1">Product #{order.product_id ?? "—"} · {order.delivery_type || "auto"} delivery</p></td>
                          <td className="p-4 font-bold whitespace-nowrap">${Number(order.amount).toFixed(2)} {order.currency || "USD"}</td>
                          <td className="p-4"><span className={"inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase " + (statusStyles[status] || statusStyles.cancelled)}>{status}</span><p className="text-[11px] text-slate-500 mt-1">{order.payment_provider}</p>{order.transaction_id && <p className="text-[10px] text-slate-500 mt-1 break-all">TXID: <span className="font-mono">{order.transaction_id}</span></p>}</td>
                          <td className="p-4"><button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline">{expandedId === order.id ? "Hide" : "View"} details</button></td>
                        </tr>
                        {expandedId === order.id && (
                          <tr className="bg-slate-50 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800">
                            <td colSpan={6} className="p-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div><p className="text-slate-500 mb-1">Payment reference</p><p className="font-mono break-all">{order.payment_id}</p></div>
                                <div><p className="text-slate-500 mb-1">36-hour protection expires</p><p>{order.protection_until ? formatDate(order.protection_until) : "Not set yet"}</p></div>
                                {order.transaction_id && <div className="md:col-span-2"><p className="text-slate-500 mb-1">Binance Pay Transaction ID</p><p className="font-mono break-all font-bold">{order.transaction_id}</p><p className="text-[10px] text-amber-600 mt-1">Verify this transaction in your Binance Pay account before approving.</p></div>}
                                {order.payment_provider === "binance_pay" && order.payment_status === "pending" && <div className="md:col-span-2 flex flex-wrap gap-2"><button onClick={() => reviewBinanceOrder(order.id, "approve")} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">Verify & Approve Payment</button><button onClick={() => reviewBinanceOrder(order.id, "reject")} className="px-4 py-2 rounded-lg bg-rose-600/10 text-rose-600 border border-rose-500/20 text-xs font-bold">Reject Payment</button></div>}
                                <div className="md:col-span-2"><p className="text-slate-500 mb-1">Delivery information</p><pre className="whitespace-pre-wrap break-words font-sans rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">{order.delivery_content || "No delivery information recorded."}</pre></div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="text-[11px] text-slate-500">Only orders recorded in the My Digital Store database are shown here. Cryptomus orders complete after a valid webhook. Binance Pay orders remain Pending until you verify the transaction ID and approve them here.</p>
      </div>
    </main>
  );
}
