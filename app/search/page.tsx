"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  discount_price?: number | null;
  discount_until?: string | null;
  delivery_type?: "auto" | "manual";
  image_url: string | null;
  views?: number;
  seller_id?: string | null;
  seller_name?: string | null;
  voucher_codes?: string | null;
  sold_count?: number;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSearchResults() {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const cleanQuery = query.trim().toLowerCase();
      const words = cleanQuery.split(/\s+/).filter(Boolean);

      try {
        const orConditions = words
          .flatMap((w) => [`title.ilike.%${w}%`, `category.ilike.%${w}%`])
          .join(",");

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .or(orConditions)
          .order("id", { ascending: false });

        if (error) throw error;

        if (data) {
          const matchedResults = data.filter((item) => {
            const targetText = `${item.title} ${item.category}`.toLowerCase();
            return words.every((word) => targetText.includes(word));
          });
          setResults(matchedResults);
        }
      } catch (error) {
        console.error("Search fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSearchResults();
  }, [query]);

  const getStockCount = (voucherCodes?: string | null) => {
    if (!voucherCodes) return 0;
    return voucherCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-6 md:p-10 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={32}
                height={32}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">
              Inskeys
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl transition"
          >
            ← Back to Store
          </Link>
        </div>

        {/* Search Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Search Results for "{query}"
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {!loading && `Found ${results.length} matching products`}
          </p>
        </div>

        {/* Content Area */}
        {loading ? (
          /* Animated Skeleton Loader */
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 animate-pulse">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
            <span className="text-4xl block mb-3">🔍</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No results found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try checking your spelling or using different keywords.</p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {results.map((product) => {
              const stock = getStockCount(product.voucher_codes);
              const isOfficial = !product.seller_id || product.seller_name === "Official Store";

              const hasDiscount = Boolean(
                product.discount_price &&
                  product.discount_price < product.price &&
                  (!product.discount_until || new Date(product.discount_until) > new Date())
              );
              
              const discountPercent =
                hasDiscount && product.price > 0
                  ? (((product.price - product.discount_price!) / product.price) * 100).toFixed(2)
                  : null;

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-sm dark:shadow-lg hover:shadow-sky-500/5 cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">🎮</span>
                      )}

                      {hasDiscount && (
                        <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg rounded-tl-xl shadow-sm z-10">
                          {discountPercent}% OFF
                        </div>
                      )}

                      <div className="absolute bottom-0 right-0 bg-black/70 backdrop-blur-md text-[9px] text-slate-200 px-1.5 py-0.5 rounded-tl-lg rounded-br-xl font-mono flex items-center gap-1 z-10 border-t border-l border-white/10">
                        <span>👁️</span><span>{product.views || 0}</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 sm:line-clamp-3 leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-300 transition">
                        {product.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] pt-1">
                        {isOfficial ? (
                          <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0 shadow-xs">
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </span>
                            <span>Official Store</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (product.seller_id) router.push(`/seller/${product.seller_id}`);
                            }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <span>🏪</span> {product.seller_name || "Seller"}
                          </button>
                        )}

                        {product.delivery_type === "manual" ? (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <span>🕒</span> Manual Delivery
                          </span>
                        ) : (
                          <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <span>⚡</span> Auto Delivery
                          </span>
                        )}

                        {product.delivery_type !== "manual" && (
                          <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            Stock: <strong className={stock > 0 ? "text-emerald-500 dark:text-emerald-400 font-bold" : "text-rose-500 dark:text-rose-400 font-bold"}>{stock}</strong>
                          </span>
                        )}

                        <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          Sold: <strong className="text-slate-800 dark:text-slate-200 font-bold">{product.sold_count || 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-none">Price</span>
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-1.5 justify-end">
                          <span className="text-[11px] line-through text-slate-400 dark:text-slate-500">${product.price}</span>
                          <span className="text-xs sm:text-base font-black text-emerald-500 dark:text-emerald-400 leading-tight">${product.discount_price}</span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-base font-black text-sky-500 dark:text-sky-400 leading-tight">${product.price}</span>
                      )}
                    </div>
                    <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl transition whitespace-nowrap shadow-md shadow-sky-500/20">
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}