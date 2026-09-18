"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

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

      // ভিউজ এক বাড়ানো
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-400 font-mono text-sm">
        Loading product details...
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

  const handleCheckout = () => {
    if (stockCount === 0) {
      alert("This item is currently out of stock!");
      return;
    }
    setBuying(true);
    alert(`Proceeding to checkout for ${product.title} ($${product.price})`);
    setBuying(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-sky-500/20">
              S
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Shovo<span className="text-sky-400">Store</span>
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
          {/* ইমেজ কলাম */}
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

              {/* ভিউজ ব্যাজ */}
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-[10px] text-slate-300 px-2 py-1 rounded-md font-mono flex items-center gap-1 border border-white/10">
                <span>👁️</span>
                <span>{product.views || 0} views</span>
              </div>
            </div>
          </div>

          {/* প্রোডাক্ট ডিটেইলস */}
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

              {/* স্টোর নাম, গোল ফেসবুক ব্লু ভেরিফাইড ব্যাজ, স্টক ও সোল্ড */}
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

              {/* প্রাইস বক্স */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Price</span>
                <span className="text-3xl font-black text-sky-400 font-mono">
                  ${product.price} <span className="text-xs text-slate-500 font-sans">USD</span>
                </span>
              </div>

              {/* বিবরণ */}
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

            <div className="pt-2">
              <button
                onClick={handleCheckout}
                disabled={buying || stockCount === 0}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  stockCount > 0
                    ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-950"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                }`}
              >
                {stockCount > 0 ? (
                  <span>Buy Now — Instant Delivery →</span>
                ) : (
                  <span>Out of Stock</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}