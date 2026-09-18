"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  image_url: string | null;
  views?: number;
  seller_id?: string | null;
  seller_name?: string | null;
  voucher_codes?: string | null;
  sold_count?: number;
}

export default function CategoryProductsPage() {
  const params = useParams();
  const rawName = params?.name as string;
  const categoryName = decodeURIComponent(rawName || "");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryProducts() {
      if (!categoryName) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("category", categoryName)
        .order("id", { ascending: false });

      if (data) {
        setProducts(data);
      }
      setLoading(false);
    }

    loadCategoryProducts();
  }, [categoryName]);

  const getStockCount = (voucherCodes?: string | null) => {
    if (!voucherCodes) return 0;
    return voucherCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-400 font-mono text-sm">
        Loading {categoryName} products...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* টপ হেডার বার */}
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
            ← Back to Storefront
          </Link>
        </div>

        {/* ক্যাটাগরি টাইটেল ব্যানার */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">
              Category Showcase
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{categoryName}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Found {products.length} active listings under this category.
            </p>
          </div>
          <span className="text-4xl sm:text-5xl">🎮</span>
        </div>

        {/* প্রোডাক্ট তালিকা */}
        {products.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No products found under "{categoryName}".
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {products.map((product) => {
              const stock = getStockCount(product.voucher_codes);
              const isOfficial = !product.seller_id || product.seller_name === "Official Store";

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-lg hover:shadow-sky-500/5 cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* ছবি এবং ছবির এক কোণায় ছোট ভিউ কাউন্ট */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-700/60">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <span className="text-slate-600 text-[10px]">No Image</span>
                      )}

                      {/* ছবির ডানপাশের কোণায় ভিউজ ব্যাজ */}
                      <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs text-[9px] text-slate-300 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 border border-white/10">
                        <span>👁️</span>
                        <span>{product.views || 0}</span>
                      </div>
                    </div>

                    {/* টাইটেল, ক্যাটাগরি, অফিসিয়াল স্টোর ফেসবুক ব্যাজ, স্টক ও সোল্ড */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-sky-300 transition">
                        {product.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] pt-1">
                        {/* ফেসবুক ব্লু ভেরিফাইড টিক সহ Official Store */}
                        {isOfficial ? (
                          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0 shadow-xs">
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
                          <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1">
                            <span>🏪</span> {product.seller_name || "Seller"}
                          </span>
                        )}

                        {/* স্টক */}
                        <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400 font-medium">
                          Stock:{" "}
                          <strong className={stock > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {stock}
                          </strong>
                        </span>

                        {/* সোল্ড কাউন্ট */}
                        <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400 font-medium">
                          Sold: <strong className="text-slate-200 font-bold">{product.sold_count || 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block leading-none">Price</span>
                      <span className="text-xs sm:text-base font-black text-sky-400 leading-tight">
                        ${product.price}
                      </span>
                    </div>
                    <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl transition whitespace-nowrap shadow-md shadow-sky-950">
                      Buy Now →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}