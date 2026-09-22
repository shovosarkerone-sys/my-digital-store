"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  description: string;
  image_url: string | null;
  views?: number;
  seller_id?: string | null;
  seller_name?: string | null;
  voucher_codes?: string | null;
  sold_count?: number;
}

interface Category {
  id: number;
  name: string;
  image_url?: string | null;
}

export default function StoreFront({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const productsSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    async function checkUserStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        setIsSeller(!!sellerData);
      }
    }

    checkUserStatus();
  }, []);

  // Filter & Search Logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    if (selectedCategoryFilter !== "all") {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedCategoryFilter.toLowerCase()
      );
    }

    const cleanQuery = searchQuery.trim().toLowerCase();
    if (cleanQuery) {
      const searchWords = cleanQuery.split(/\s+/).filter(Boolean);
      result = result.filter((product) => {
        const targetText = `${product.title} ${product.category}`.toLowerCase();
        return searchWords.every((word) => targetText.includes(word));
      });
    }

    return result;
  }, [initialProducts, searchQuery, selectedCategoryFilter]);

  const instantSuggestions = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    if (!cleanQuery) return [];

    const searchWords = cleanQuery.split(/\s+/).filter(Boolean);

    return initialProducts
      .filter((product) => {
        const targetText = `${product.title} ${product.category}`.toLowerCase();
        return searchWords.every((word) => targetText.includes(word));
      })
      .slice(0, 6);
  }, [initialProducts, searchQuery]);

  const getStockCount = (voucherCodes?: string | null) => {
    if (!voucherCodes) return 0;
    return voucherCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0).length;
  };

  const handleCategoryClick = (catName: string) => {
    setSelectedCategoryFilter(catName);
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white font-sans">
      
      {/* Clean & Professional Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-10 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/icon.png"
            alt="Inskeys"
            width={38}
            height={38}
            className="w-9 h-9 object-contain shrink-0 transition-transform group-hover:scale-105 bg-transparent"
          />
          <span className="font-black text-xl tracking-tight text-white leading-none">
            Inskeys
          </span>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {!isSeller && (
            <Link
              href="/become-seller"
              className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3.5 py-2 rounded-xl transition cursor-pointer hidden sm:inline-block"
            >
              Become a Seller
            </Link>
          )}

          {isSeller && (
            <Link
              href="/seller-dashboard"
              className="text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              Merchant Hub
            </Link>
          )}

          {currentUser ? (
            <Link
              href="/dashboard"
              className="text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-black">
                {currentUser.user_metadata?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="max-w-[90px] truncate hidden sm:inline">
                {currentUser.user_metadata?.full_name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth"
              className="text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-sky-950"
            >
              Log In
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full space-y-12">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-5 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            🛡️ 36-Hour Escrow Buyer Protection Active
          </div>

          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              <span className="text-white">Premium Digital </span>
              <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                Marketplace
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
              Secure game keys, software licenses, and verified gift cards with instant cryptographic fulfillment.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full max-w-xl text-left mt-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search game keys, gift cards, software..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-2xl py-3.5 pl-11 pr-28 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-xl"
              />
              <span className="absolute left-4 text-slate-500 text-sm">🔍</span>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-20 text-xs text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}

              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                Search
              </button>
            </form>

            {/* Instant Suggestions Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-40 divide-y divide-slate-800/70">
                {instantSuggestions.length > 0 ? (
                  instantSuggestions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/product/${item.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-slate-800/80 transition group text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span>🎮</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </div>
                      <span className="text-xs font-bold text-sky-400">${item.price}</span>
                    </Link>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">No suggestions found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Categories Grid (Click to scroll down instantly) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Browse Categories
            </h2>
            {selectedCategoryFilter !== "all" && (
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className="text-xs text-sky-400 hover:underline font-semibold cursor-pointer"
              >
                Clear Filter (Show All)
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div
              onClick={() => handleCategoryClick("all")}
              className={`group flex flex-col items-center p-3.5 rounded-2xl border text-center transition duration-200 cursor-pointer shadow-md ${
                selectedCategoryFilter === "all"
                  ? "border-sky-500 bg-sky-500/10 text-white"
                  : "border-slate-800 bg-slate-900/90 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className="w-12 h-12 mb-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg">
                🔥
              </div>
              <span className="text-xs font-bold truncate w-full">All Items</span>
            </div>

            {categories.map((cat) => {
              const isSelected = selectedCategoryFilter.toLowerCase() === cat.name.toLowerCase();
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`group flex flex-col items-center p-3.5 rounded-2xl border text-center transition duration-200 cursor-pointer shadow-md ${
                    isSelected
                      ? "border-sky-500 bg-sky-500/10 text-white"
                      : "border-slate-800 bg-slate-900/90 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="w-12 h-12 mb-2 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group-hover:scale-105 transition">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base">🎮</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold truncate w-full">{cat.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Products Section */}
        <section ref={productsSectionRef} className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                {selectedCategoryFilter === "all" ? "All Available Products" : `${selectedCategoryFilter} Items`}
              </h2>
              <p className="text-xs text-slate-400">
                Showing {filteredProducts.length} verified listings
              </p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-400 text-xs space-y-2">
              <span className="text-2xl block">📦</span>
              <p className="font-bold text-white">No products found in this category.</p>
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className="mt-2 px-4 py-2 bg-sky-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => {
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
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-lg hover:shadow-sky-500/5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-950 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-800">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
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
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                          {product.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-sky-300 transition">
                          {product.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] pt-0.5">
                          {isOfficial ? (
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                              <span>✓</span> Official Store
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1">
                              <span>🏪</span> {product.seller_name || "Merchant"}
                            </span>
                          )}

                          {product.delivery_type === "manual" ? (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold">
                              🕒 Manual Delivery
                            </span>
                          ) : (
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold">
                              ⚡ Auto Delivery
                            </span>
                          )}

                          {product.delivery_type !== "manual" && (
                            <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400 font-medium">
                              Stock: <strong className={stock > 0 ? "text-emerald-400" : "text-rose-400"}>{stock}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block leading-none">Price</span>
                        {hasDiscount ? (
                          <div className="flex items-baseline gap-1.5 justify-end">
                            <span className="text-[11px] line-through text-slate-500 font-mono">
                              ${product.price}
                            </span>
                            <span className="text-xs sm:text-base font-black text-emerald-400 font-mono">
                              ${product.discount_price}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-base font-black text-sky-400 font-mono">
                            ${product.price}
                          </span>
                        )}
                      </div>
                      <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-xl transition whitespace-nowrap shadow-md">
                        Buy Now →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}