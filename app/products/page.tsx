"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  discount_price?: number | null;
  discount_until?: string | null;
  delivery_type?: "auto" | "manual";
  description?: string;
  image_url: string | null;
  views?: number;
  seller_id?: string | null;
  seller_name?: string | null;
  voucher_codes?: string | null;
  sold_count?: number;
  created_at?: string;
}

interface Category {
  id: number;
  name: string;
}

export default function AllProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState<"all" | "auto" | "manual">("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "popular" | "sold">("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    async function loadCatalogData() {
      try {
        // Fetch all products
        const { data: prodData } = await supabase
          .from("products")
          .select("*")
          .order("id", { ascending: false });

        if (prodData) setProducts(prodData);

        // Fetch categories for filter dropdown
        const { data: catData } = await supabase
          .from("categories")
          .select("id, name")
          .order("name");

        if (catData) setCategories(catData);
      } catch (err) {
        console.error("Error loading products catalog:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalogData();
  }, []);

  const getStockCount = (voucherCodes?: string | null) => {
    if (!voucherCodes) return 0;
    return voucherCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0).length;
  };

  // Filter & Sort Pipeline
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search Query (Multi-keyword tokenized)
    const cleanQuery = searchQuery.trim().toLowerCase();
    if (cleanQuery) {
      const words = cleanQuery.split(/\s+/).filter(Boolean);
      result = result.filter((p) => {
        const text = `${p.title} ${p.category} ${p.seller_name || ""}`.toLowerCase();
        return words.every((word) => text.includes(word));
      });
    }

    // Category Filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Delivery Type Filter
    if (selectedDelivery !== "all") {
      if (selectedDelivery === "manual") {
        result = result.filter((p) => p.delivery_type === "manual");
      } else {
        result = result.filter((p) => p.delivery_type !== "manual");
      }
    }

    // Sorting
    result.sort((a, b) => {
      const priceA = a.discount_price && a.discount_price < a.price ? a.discount_price : a.price;
      const priceB = b.discount_price && b.discount_price < b.price ? b.discount_price : b.price;

      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "popular") return (b.views || 0) - (a.views || 0);
      if (sortBy === "sold") return (b.sold_count || 0) - (a.sold_count || 0);
      return b.id - a.id; // newest default
    });

    return result;
  }, [products, searchQuery, selectedCategory, selectedDelivery, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const displayedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-10 selection:bg-sky-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Navbar Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={32}
                height={32}
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
            >
              ← Back to Storefront
            </Link>
          </div>
        </div>

        {/* Catalog Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-3">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-1">
                Verified Global Marketplace Catalog
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                All Available Products
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Showing {filteredAndSortedProducts.length} of {products.length} digital keys and game assets.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-semibold text-amber-300 shrink-0 self-start sm:self-auto">
              <span>🛡️</span> 36-Hour Escrow Protection
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Controls Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Live Search Input */}
            <div className="sm:col-span-6 relative">
              <input
                type="text"
                placeholder="Search products by title, keyword, or merchant..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl py-2.5 pl-10 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
              <span className="absolute left-3.5 top-3 text-slate-500 text-xs">🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular (Views)</option>
                <option value="sold">Best Selling (Orders)</option>
              </select>
            </div>

          </div>

          {/* Delivery Filter Pills */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto text-[11px]">
            <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Fulfillment:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedDelivery("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                selectedDelivery === "all"
                  ? "bg-sky-500 text-white border-sky-400"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDelivery("auto");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg border font-semibold transition cursor-pointer flex items-center gap-1 ${
                selectedDelivery === "auto"
                  ? "bg-sky-500 text-white border-sky-400"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              <span>⚡</span>
              <span>Auto Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDelivery("manual");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg border font-semibold transition cursor-pointer flex items-center gap-1 ${
                selectedDelivery === "manual"
                  ? "bg-amber-500 text-white border-amber-400"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              <span>🕒</span>
              <span>Manual Delivery</span>
            </button>
          </div>
        </div>

        {/* Products Listing Showcase */}
        {loading ? (
          <div className="p-16 text-center text-xs text-sky-400 font-mono">
            Loading catalog products...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center text-slate-400 text-xs space-y-2">
            <span className="text-2xl block">🔍</span>
            <p className="font-semibold text-white">No products found</p>
            <p className="text-slate-500">Try changing your search terms or filters.</p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {displayedProducts.map((product) => {
              const stock = getStockCount(product.voucher_codes);
              const isOfficial = !product.seller_id || product.seller_name === "Official Store";

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
                <div
                  key={product.id}
                  onClick={() => router.push(`/product/${product.id}`)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-lg hover:shadow-sky-500/5 cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-700/60">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <span className="text-slate-600 text-xs">🎮</span>
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

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 sm:line-clamp-3 leading-snug group-hover:text-sky-300 transition">
                        {product.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] pt-1">
                        {/* Seller Identity */}
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (product.seller_id) {
                                router.push(`/seller/${product.seller_id}`);
                              }
                            }}
                            className="bg-slate-800 hover:bg-slate-700 hover:text-sky-400 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <span>🏪</span> {product.seller_name || "Merchant"}
                          </button>
                        )}

                        {/* Delivery Method */}
                        {product.delivery_type === "manual" ? (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <span>🕒</span> Manual Delivery
                          </span>
                        ) : (
                          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                            <span>⚡</span> Auto Delivery
                          </span>
                        )}

                        {product.delivery_type !== "manual" && (
                          <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400 font-medium">
                            Stock:{" "}
                            <strong className={stock > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {stock}
                            </strong>
                          </span>
                        )}

                        <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400 font-medium">
                          Sold: <strong className="text-slate-200 font-bold">{product.sold_count || 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Buy Button */}
                  <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block leading-none">Price</span>
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-1.5 justify-end">
                          <span className="text-[11px] line-through text-slate-500">
                            ${product.price}
                          </span>
                          <span className="text-xs sm:text-base font-black text-emerald-400 leading-tight">
                            ${product.discount_price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-base font-black text-sky-400 leading-tight">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl transition whitespace-nowrap shadow-md shadow-sky-950">
                      Buy Now →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 150, behavior: "smooth" });
                }}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                  currentPage === page
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}