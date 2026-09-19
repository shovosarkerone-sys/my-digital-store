"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

interface PaymentMethod {
  id: string;
  name: string;
  badge: string;
  tag: string;
  color: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "binance", name: "Binance Pay", badge: "🟡", tag: "Zero Fees / Instant", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  { id: "crypto", name: "Crypto (USDT / BTC)", badge: "⚡", tag: "Web3 Automated", color: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  { id: "card", name: "Visa / Mastercard", badge: "💳", tag: "International", color: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  { id: "bkash", name: "bKash", badge: "🌸", tag: "Personal / Merchant", color: "border-pink-500/30 bg-pink-500/10 text-pink-300" },
  { id: "rocket", name: "Rocket / Nagad", badge: "🟣", tag: "Instant MFS", color: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
  { id: "bank", name: "Bank Wire Transfer", badge: "🏦", tag: "Direct Deposit", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
];

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setProduct(data);

      await supabase
        .from("products")
        .update({ views: (data.views || 0) + 1 })
        .eq("id", data.id);

      setLoading(false);
    }

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="w-28 h-8 bg-slate-800 rounded-lg"></div>
            <div className="w-24 h-8 bg-slate-800 rounded-xl"></div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="w-full aspect-square bg-slate-800/80 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="w-24 h-4 bg-slate-800 rounded"></div>
              <div className="w-3/4 h-8 bg-slate-800 rounded"></div>
              <div className="w-1/2 h-5 bg-slate-800 rounded"></div>
              <div className="w-full h-24 bg-slate-800/60 rounded-xl"></div>
              <div className="w-full h-12 bg-slate-800 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 space-y-4">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <Link href="/" className="text-xs text-sky-400 underline">
          ← Return to Storefront
        </Link>
      </div>
    );
  }

  const stockCount = product.voucher_codes
    ? product.voucher_codes
        .split("\n")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0).length
    : 0;

  const isOfficial = !product.seller_id || product.seller_name === "Official Store";

  const whatsappMessage = encodeURIComponent(
    `Hello Inskeys, I would like to buy: "${product.title}" (Price: $${product.price} USD). Is it available?`
  );
  const whatsappUrl = `https://wa.me/8801797302397?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
          >
            ← Back to Products
          </Link>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl">
          <div className="space-y-3">
            <div className="w-full aspect-square bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/70 relative flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 text-sm font-mono">No Image Available</span>
              )}

              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-[10px] text-slate-300 px-2 py-1 rounded-md font-mono flex items-center gap-1 border border-white/10">
                <span>👁️</span>
                <span>{product.views || 0} views</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                  {product.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {product.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {isOfficial ? (
                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0 shadow-xs">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>Official Store</span>
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1.5">
                    <span>🏪</span>
                    <span>{product.seller_name || "Community Merchant"}</span>
                  </span>
                )}

                <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg font-medium text-slate-400">
                  Stock:{" "}
                  <strong className={stockCount > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {stockCount} available
                  </strong>
                </span>

                <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg font-medium text-slate-400">
                  Sold: <strong className="text-white font-bold">{product.sold_count || 0}</strong>
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Price</span>
                <span className="text-3xl font-black text-sky-400 font-mono">
                  ${product.price} <span className="text-xs text-slate-500 font-sans">USD</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Product Description & Redemption
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  {product.description || "Instant digital key delivery upon payment confirmation."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                <span>🛡️</span>
                <span>Automated Escrow Protection — Instant code fulfillment on verified payment.</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={stockCount === 0}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  stockCount > 0
                    ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-950"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                }`}
              >
                {stockCount > 0 ? "Buy Now →" : "Out of Stock"}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl font-bold text-xs transition border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>💬</span>
                <span>Buy with WhatsApp (+880 1797-302397)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white">Select Payment Method</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose your preferred gateway to complete checkout
                </p>
              </div>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setSelectedMethod(null);
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <span className="text-[11px] text-slate-500 block truncate">{product.title}</span>
                <span className="text-xs font-bold text-slate-200">Amount Due</span>
              </div>
              <span className="text-lg font-black text-sky-400 font-mono">${product.price} USD</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedMethod(pm.id)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    selectedMethod === pm.id
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{pm.badge}</span>
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">{pm.name}</span>
                      <span className="text-[10px] text-slate-400 block">{pm.tag}</span>
                    </div>
                  </div>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    selectedMethod === pm.id ? "border-sky-500 bg-sky-500" : "border-slate-700"
                  }`}>
                    {selectedMethod === pm.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={!selectedMethod}
                onClick={() => {
                  alert(`Payment gateway integration for [${selectedMethod?.toUpperCase()}] will be configured here.`);
                }}
                className={`w-full py-3 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer ${
                  selectedMethod
                    ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-950"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                }`}
              >
                {selectedMethod ? "Proceed to Gateway →" : "Select a Gateway Above"}
              </button>
              <p className="text-[10px] text-center text-slate-500">
                Encrypted & Secure 256-bit automated transaction processing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}