"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  image_url: string | null;
  views?: number;
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false); // মেনু ওপেন/ক্লোজ স্টেট
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 30;

  // ইনস্ট্যান্ট সার্চ ও ক্যাটাগরি অনুযায়ী প্রোডাক্ট ফিল্টার
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialProducts, selectedCategory, searchQuery]);

  // সার্চবারে লাইভ ইনস্ট্যান্ট সাজেশন (শীর্ষ ৬টি প্রোডাক্ট)
  const instantSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return initialProducts
      .filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 6);
  }, [initialProducts, searchQuery]);

  // পেজিনেশন (সর্বোচ্চ ৩০টি প্রতি পেজে)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ১ লাইনে ৬টি করে ক্যাটাগরি অথবা শো মোর
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* টপ হেডার বার: ৩ লাইনের মেনু বাটন ও লোগো */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* ৩ লাইনের হ্যামবার্গার মেনু বাটন */}
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

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-sky-500/20">
              S
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Shovo<span className="text-sky-400">Store</span>
            </span>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full hidden sm:inline-block">
          ⚡ 100% Automated Delivery
        </span>
      </header>

      {/* ব্যাকড্রপ ওভারলে (মেনু খোলা থাকলে বাইরে ক্লিক করলে বন্ধ হবে) */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* ৩ লাইনে ক্লিক করলে স্লাইড হয়ে খুলে যাওয়া মেনু ড্রয়ার */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 p-5 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* মেনুর ভেতরের হেডার এবং ক্রস (✕) বাটন */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-sky-500/20">
              S
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white block leading-none">
                Shovo<span className="text-sky-400">Store</span>
              </span>
              <span className="text-[9px] text-slate-500 font-medium tracking-widest uppercase">
                Navigation
              </span>
            </div>
          </div>

          {/* মেনু বন্ধ করার ক্রস (✕) বাটন */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* মেনুর অপশন তালিকা */}
        <nav className="space-y-6 flex-1 overflow-y-auto pr-1">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
              Browse Menu
            </span>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setCurrentPage(1);
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-2">🛍️ All Products</span>
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                {initialProducts.length}
              </span>
            </button>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
              Categories
            </span>
            <div className="space-y-1">
              {categories.map((cat) => {
                const count = initialProducts.filter(
                  (p) => p.category.toLowerCase() === cat.name.toLowerCase()
                ).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setCurrentPage(1);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>

      {/* মূল কনটেন্ট এরিয়া */}
      <main className="p-5 md:p-10 max-w-7xl mx-auto w-full space-y-10">
        {/* মাঝখান বরাবর হেডার ও ইনস্ট্যান্ট সার্চবার */}
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

          {/* মাঝখান বরাবর ইনস্ট্যান্ট সার্চবার (উইথ লাইভ ড্রপডাউন সাজেশন) */}
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
              <span className="absolute left-4 top-3.5 text-slate-500 text-base">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* ইনস্ট্যান্ট লাইভ সাজেশন ড্রপডাউন */}
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

        {/* সার্চবারের নিচে ১ লাইনে ৬টি করে ক্যাটাগরি গ্রিড (ছবিসহ) */}
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
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setCurrentPage(1);
                }}
                className={`group flex flex-col items-center p-3.5 rounded-2xl border text-center transition duration-200 cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? "bg-sky-500/10 border-sky-500 text-sky-400 shadow-lg shadow-sky-500/10"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200"
                }`}
              >
                <div className="w-14 h-14 mb-2 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center group-hover:scale-105 transition duration-200">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">🎮</span>
                  )}
                </div>
                <span className="text-xs font-semibold truncate w-full">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* প্রোডাক্ট লিস্ট সেকশন (সর্বোচ্চ ৩০টি) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
            <div>
              <h2 className="text-lg font-bold text-white capitalize">
                {selectedCategory === "all"
                  ? "All Products"
                  : `${selectedCategory} Products`}
              </h2>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displayedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl overflow-hidden flex flex-col group transition duration-300 shadow-xl"
                >
                  {/* প্রোডাক্ট ইমেজ ও ভিউ কাউন্টার */}
                  <div className="h-40 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-slate-600 text-xs">No Image</span>
                    )}

                    {/* অরিজিনাল ভিউ কাউন্টার */}
                    <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-[11px] text-slate-300 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <span>👁️</span>
                      <span>{product.views || 0} views</span>
                    </div>
                  </div>

                  {/* প্রোডাক্ট বিবরণ ও অরিজিনাল প্রাইস */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h3 className="text-xs font-bold text-white line-clamp-2 mt-1 group-hover:text-sky-300 transition">
                        {product.title}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block leading-none">Price</span>
                        <span className="text-sm font-black text-sky-400">
                          ${product.price} <span className="text-[10px] text-slate-400 font-normal">USD</span>
                        </span>
                      </div>
                      <span className="text-[11px] bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white px-2.5 py-1 rounded-lg font-bold transition">
                        Buy Now →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* পেজিনেশন কন্ট্রোল (৩০টির বেশি প্রোডাক্টের জন্য) */}
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