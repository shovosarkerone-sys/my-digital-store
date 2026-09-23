"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  discount_price?: number | null;
  discount_until?: string | null;
  delivery_type?: "auto" | "manual";
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
  const [sortOption, setSortOption] = useState<string>("latest");

  useEffect(() => {
    async function loadCategoryProducts() {
      if (!categoryName) return;

      const { data } = await supabase
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

  const sortedProducts = useMemo(() => {
    let result = [...products];

    result.sort((a, b) => {
      const priceA =
        a.discount_price &&
        a.discount_price < a.price &&
        (!a.discount_until || new Date(a.discount_until) > new Date())
          ? a.discount_price
          : a.price;
      const priceB =
        b.discount_price &&
        b.discount_price < b.price &&
        (!b.discount_until || new Date(b.discount_until) > new Date())
          ? b.discount_price
          : b.price;

      switch (sortOption) {
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "latest":
        default:
          return b.id - a.id;
      }
    });

    return result;
  }, [products, sortOption]);

  const getStockCount = (voucherCodes?: string | null) => {
    if (!voucherCodes) return 0;
    return voucherCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* হেডার */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={34}
                height={34}
                className="w-8 h-8 object-contain bg-transparent"
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
            ← Home
          </Link>
        </div>

        {/* ক্যাটাগরি ব্যানার */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-sm dark:shadow-xl transition-colors duration-200">
          <div>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest block mb-1">
              Category Showcase
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {categoryName || "Browse Products"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {loading
                ? "Discover verified digital licenses, vouchers, and game keys."
                : `Found ${products.length} active listings under this category.`}
            </p>
          </div>
          <span className="text-4xl sm:text-5xl">🎮</span>
        </div>

        {/* প্রোডাক্ট লিস্ট ও ফিল্টার */}
        {loading ? (
          <div className="space-y-2.5 sm:space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 animate-pulse"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="w-3/5 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-sm shadow-sm">
            No products found under "{categoryName}".
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="relative w-full sm:w-auto">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300 text-xs font-semibold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer shadow-sm"
                >
                  <option value="latest">Sort by: Latest Added</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-[10px]">
                  ▼
                </span>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {sortedProducts.map((product) => {
                const stock = getStockCount(product.voucher_codes);
                const isOfficial =
                  !product.seller_id || product.seller_name === "Official Store";

                const hasDiscount = Boolean(
                  product.discount_price &&
                  product.discount_price < product.price &&
                  (!product.discount_until || new Date(product.discount_until) > new Date())
                );
                const discountPercent =
                  hasDiscount && product.price > 0
                    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
                    : null;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-sm dark:shadow-lg hover:shadow-sky-500/5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-200 dark:border-slate-700/60">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs">🎮</span>
                        )}

                        {hasDiscount && (
                          <div className="absolute top-1 left-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                            {discountPercent}% OFF
                          </div>
                        )}

                        <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs text-[9px] text-slate-300 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 border border-white/10">
                          <span>👁️</span>
                          <span>{product.views || 0}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                          {product.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-300 transition">
                          {product.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] pt-1">
                          {isOfficial ? (
                            <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1.5">
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
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1">
                              <span>🏪</span> {product.seller_name || "Seller"}
                            </span>
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
                              Stock:{" "}
                              <strong
                                className={
                                  stock > 0
                                    ? "text-emerald-500 dark:text-emerald-400 font-bold"
                                    : "text-rose-500 dark:text-rose-400 font-bold"
                                }
                              >
                                {stock}
                              </strong>
                            </span>
                          )}

                          <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            Sold:{" "}
                            <strong className="text-slate-800 dark:text-slate-200 font-bold">
                              {product.sold_count || 0}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-none">
                          Price
                        </span>
                        {hasDiscount ? (
                          <div className="flex items-baseline gap-1.5 justify-end">
                            <span className="text-[11px] line-through text-slate-400 dark:text-slate-500">
                              ${product.price}
                            </span>
                            <span className="text-xs sm:text-base font-black text-emerald-500 dark:text-emerald-400 leading-tight">
                              ${product.discount_price}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-base font-black text-sky-500 dark:text-sky-400 leading-tight">
                            ${product.price}
                          </span>
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
          </div>
        )}

      </div>
    </div>
  );
}