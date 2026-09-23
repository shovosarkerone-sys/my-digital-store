"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CryptoPayButton({
  productId,
  price,
  productTitle,
}: {
  productId: string | number;
  price: number;
  productTitle?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // বায়ার লগইন থাকলে তার ইমেইল আগে থেকেই অটো-ফিল করবে
  useEffect(() => {
    async function getLoggedInUserEmail() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
        }
      } catch {
        // Fallback if guest
      }
    }
    getLoggedInUserEmail();
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please provide a valid email to receive your digital license.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch("/api/checkout/cryptomus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, buyerEmail: cleanEmail }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setErrorMsg(data.error || "Payment session failed to initialize. Try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gateway connection error. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* মূল বাই বাটন */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-[#0052FF] hover:bg-[#0043D1] active:scale-98 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all duration-200 text-sm shadow-md shadow-blue-500/20 dark:shadow-blue-900/50 cursor-pointer group"
      >
        <span className="text-base group-hover:scale-110 transition-transform">⚡</span>
        <span>Pay with Crypto / Binance (${price.toFixed(2)})</span>
      </button>

      {/* প্রিমিয়াম চেকআউট মডাল উইন্ডো */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl dark:shadow-2xl space-y-5 text-left overflow-hidden transition-colors">
            {/* ব্যাকগ্রাউন্ড গ্লো */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* হেডার */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                {/* অরিজিনাল লোগো (SVG Format) */}
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shadow-xs">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-full h-full text-[#0052FF]"
                  >
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Cryptomus Gateway</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Secured Blockchain Payment</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setErrorMsg("");
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* প্রোডাক্ট ও মূল্য বিবরণী */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 relative z-10">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                  {productTitle || "Digital Asset License"}
                </span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                  ${price.toFixed(2)} USD
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                <span>🛡️</span>
                <span>Protected by 36-Hour Buyer Protection Guarantee</span>
              </div>
            </div>

            {/* এরর মেসেজ */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium relative z-10">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* ইমেইল ও সাবমিট ফর্ম */}
            <form onSubmit={handleCheckout} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Delivery Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition shadow-inner font-mono"
                />
                <span className="block text-[10px] text-slate-500 mt-1">
                  Your activation key will be dispatched to this email.
                </span>
              </div>

              {/* সাপোর্টেড কারেন্সি ব্যাজ */}
              <div className="pt-1">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2">
                  Accepted Networks
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-400">
                  <span className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">USDT</span>
                  <span className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">Binance Pay</span>
                  <span className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">BTC</span>
                  <span className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg">TRC20</span>
                </div>
              </div>

              {/* অ্যাকশন বাটন */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#0052FF] hover:bg-[#0043D1] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl transition duration-200 cursor-pointer shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Connecting to Cryptomus...</span>
                    </>
                  ) : (
                    <span>Proceed to Cryptomus Invoice →</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}