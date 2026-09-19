"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 30;

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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        setIsSeller(!!sellerData);
      } else {
        setIsSeller(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const query = searchQuery.toLowerCase();
      return (
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    });
  }, [initialProducts, searchQuery]);

  const instantSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return initialProducts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 6);
  }, [initialProducts, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 12);

  const getStockCount = (voucherCodes?: string | null) => {
    if (!voucherCodes) return 0;
    return voucherCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0).length;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? (
              <span className="text-base font-bold text-sky-400 leading-none">✕</span>
            ) : (
              <>
                <span className="w-5 h-0.5 bg-slate-200 rounded-full"></span>
                <span className="w-5 h-0.5 bg-slate-200 rounded-full"></span>
                <span className="w-5 h-0.5 bg-slate-200 rounded-full"></span>
              </>
            )}
          </button>

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
            <span className="font-black text-lg tracking-tight text-white">
              Inskeys
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isSeller && (
            <Link
              href="/seller-dashboard"
              className="text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              Seller Dashboard
            </Link>
          )}

          {currentUser ? (
            <Link
              href="/dashboard"
              className="text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-black">
                {currentUser.user_metadata?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="max-w-[80px] truncate hidden sm:inline">
                {currentUser.user_metadata?.full_name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth"
              className="text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-white px-3.5 py-2 rounded-xl transition cursor-pointer shadow-md"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 p-5 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-black text-lg tracking-tight text-white leading-none">
              Inskeys
            </span>
          </div>

          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-5 flex-1 overflow-y-auto pr-1">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Merchant Center
            </span>
            {isSeller ? (
              <Link
                href="/seller-dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition"
              >
                <span>Seller Dashboard</span>
                <span>→</span>
              </Link>
            ) : (
              <Link
                href="/become-seller"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:text-white transition"
              >
                <span>Become a Seller</span>
                <span>→</span>
              </Link>
            )}
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Customer Support
            </span>
            <Link
              href="/support"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
            >
              <span>Create Support Ticket</span>
              <span>🎫</span>
            </Link>
          </div>

          {currentUser && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                Buyer Account
              </span>
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Dashboard Overview
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  My Transactions
                </Link>
              </div>
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
              Browse Menu
            </span>
            <div className="space-y-2">
              <Link
                href="/products"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 text-white shadow-lg shadow-sky-500/30 transition cursor-pointer"
              >
                <span>All Products</span>
                <span className="text-[11px] bg-sky-600/80 px-2 py-0.5 rounded-full font-mono">
                  {initialProducts.length}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsCategoriesMenuOpen(!isCategoriesMenuOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 transition cursor-pointer"
              >
                <span>Categories</span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {categories.length}
                  </span>
                  <span>{isCategoriesMenuOpen ? "▲" : "▼"}</span>
                </span>
              </button>

              {isCategoriesMenuOpen && (
                <div className="mt-2 space-y-1 max-h-56 overflow-y-auto pl-1 pr-1 bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
                  {categories.map((cat) => {
                    const count = initialProducts.filter(
                      (p) => p.category.toLowerCase() === cat.name.toLowerCase()
                    ).length;

                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${encodeURIComponent(cat.name)}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {!currentUser && (
            <div className="pt-4 border-t border-slate-800">
              <Link
                href="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer border border-slate-700"
              >
                Login / Register
              </Link>
            </div>
          )}
        </nav>
      </aside>

      <main className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full space-y-10">
        <div className="flex flex-col items-center justify-center text-center space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            ⚡ Instant Digital Delivery
          </div>

          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              <span className="text-white">Premium Digital </span>
              <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                Marketplace
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
              Explore game codes, activation licenses, and premium assets with automated crypto fulfillment.
            </p>
          </div>

          <div className="relative w-full max-w-2xl text-left mt-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by title, category, game..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-2xl py-3.5 pl-12 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition duration-200 shadow-xl"
              />
              <span className="absolute left-4 top-3.5 text-slate-500 text-base">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-40 divide-y divide-slate-800/70">
                {instantSuggestions.length > 0 ? (
                  <>
                    <div className="p-2.5 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400 font-semibold px-4">
                      <span>Matching Suggestions ({instantSuggestions.length})</span>
                      <span className="text-sky-400 text-[10px]">Instant View</span>
                    </div>
                    {instantSuggestions.map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-slate-800/80 transition group"
                      >
                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            />
                          ) : (
                            <span className="text-xs text-slate-600">No Img</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Category: {item.category}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-sky-400 block">
                            ${item.price}
                          </span>
                          <span className="text-[10px] text-slate-500 group-hover:text-sky-300">
                            Details →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No instant suggestions for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Popular Categories
            </h2>
            {categories.length > 12 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition cursor-pointer"
              >
                {showAllCategories
                  ? "Show Less ↑"
                  : `Show More (${categories.length - 12} more) ↓`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visibleCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center p-3 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-sky-500/50 hover:bg-slate-800/50 text-center transition duration-200 cursor-pointer shadow-md"
              >
                <div className="w-14 h-14 mb-2 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center group-hover:scale-105 transition duration-200">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">🎮</span>
                  )}
                </div>
                <span className="text-xs font-semibold truncate w-full text-slate-200 group-hover:text-sky-400">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
            <div>
              <h2 className="text-lg font-bold text-white">All Available Products</h2>
              <p className="text-xs text-slate-500">
                Showing {displayedProducts.length} of {filteredProducts.length} items
              </p>
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
              No products found matching your search.
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {displayedProducts.map((product) => {
                const stock = getStockCount(product.voucher_codes);
                const isOfficial = !product.seller_id || product.seller_name === "Official Store";

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-lg hover:shadow-sky-500/5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-700/60">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <span className="text-slate-600 text-[10px]">No Image</span>
                        )}

                        <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs text-[9px] text-slate-300 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 border border-white/10">
                          <span>👁️</span>
                          <span>{product.views || 0}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                          {product.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 sm:line-clamp-3 leading-snug group-hover:text-sky-300 transition">
                          {product.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] pt-1">
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

                          <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400 font-medium">
                            Stock:{" "}
                            <strong className={stock > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {stock}
                            </strong>
                          </span>

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

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 250, behavior: "smooth" });
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
        </section>
      </main>
    </div>
  );
}