"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface OrderData {
  id: number;
  product_title: string;
  amount: number;
  currency?: string;
  payment_status: string;
  delivery_type?: "auto" | "manual";
  delivery_content?: string | null;
  payment_id: string;
  seller_id?: string | null;
  seller_name?: string | null;
  created_at: string;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("payment_id", orderId)
          .maybeSingle();

        if (data) {
          setOrder(data);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sky-600 dark:text-sky-400 font-mono text-sm transition-colors duration-200">
        Verifying cryptographic transaction...
      </div>
    );
  }

  const isManual = order?.delivery_type === "manual";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* Inskeys Branding */}
      <Link href="/" className="flex items-center gap-2.5 mb-6 group">
        <Image
          src="/icon.png"
          alt="Inskeys"
          width={36}
          height={36}
          className="w-9 h-9 object-contain transition-transform group-hover:scale-105"
        />
        <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-none">
          Inskeys
        </span>
      </Link>

      <div className="max-w-xl w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Success Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black shadow-md shadow-emerald-500/10">
            ✓
          </div>

          <div>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest block mb-1">
              Payment Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Thank You For Your Purchase!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Order Reference: <span className="text-slate-700 dark:text-slate-200 font-semibold">{orderId || "N/A"}</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-300">
            <span>🛡️</span>
            <span>36-Hour Buyer Protection Active</span>
          </div>
        </div>

        {/* Order Details Container */}
        {order ? (
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-inner">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  Product Item
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {order.product_title}
                </p>
                {order.seller_name && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Merchant: <strong className="text-slate-700 dark:text-slate-200">{order.seller_name}</strong>
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  Total Paid
                </span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  ${order.amount} {order.currency || "USD"}
                </p>
              </div>
            </div>

            {/* Delivery Section */}
            {isManual ? (
              // MANUAL DELIVERY NOTICE
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
                  <span>🕒</span>
                  <span>Manual Delivery in Progress</span>
                </div>
                <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                  The seller has received your order and is preparing your activation details/credentials. You will receive an update shortly or you can coordinate directly with the seller.
                </p>
                {order.seller_id && (
                  <Link
                    href={`/seller/${order.seller_id}`}
                    className="inline-block mt-1 text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
                  >
                    View Merchant Profile & Chat →
                  </Link>
                )}
              </div>
            ) : (
              // AUTO DELIVERY KEY / CODE
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Instant Digital Activation Key:</span>
                  </span>
                  {order.delivery_content && (
                    <button
                      type="button"
                      onClick={() => handleCopy(order.delivery_content!)}
                      className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white font-bold text-[10px] rounded-lg transition cursor-pointer shadow-xs"
                    >
                      {copied ? "Copied! ✓" : "Copy Key"}
                    </button>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line select-all leading-relaxed break-all shadow-inner">
                  {order.delivery_content || "Code has been allocated to your account."}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>Your payment is confirmed on the blockchain.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              License details have been dispatched to your account dashboard.
            </p>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Link
            href="/dashboard?tab=products"
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <span>📦</span>
            <span>View All My Purchased Keys & Orders</span>
          </Link>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/"
              className="py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold text-xs rounded-xl transition border border-slate-300 dark:border-slate-700 text-center"
            >
              Back to Store
            </Link>

            <Link
              href="/dashboard?tab=support"
              className="py-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs rounded-xl transition border border-slate-200 dark:border-slate-800 text-center"
            >
              Get Support 🎫
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sky-600 dark:text-sky-400 font-mono text-sm transition-colors duration-200">
          Loading receipt details...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}