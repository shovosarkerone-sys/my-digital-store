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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 30;

  // সার্চ ও ক্যাটাগরি ফিল্টারিং
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialProducts, selectedCategory, searchQuery]);

  // পেজিনেশন
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      {/* ব্যাকড্রপ (মেনু খোলা থাকলে ব্যাকগ্রাউন্ড আবছা করবে) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* স্লাইডিং সাইডবার মেনু */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 p-6 z-50 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-black text-white">
                S
              </div>
              <span className="font-bold text-lg text-white">ShovoStore</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              title="Close Menu"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
                Browse Menu
              </span>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setCurrentPage(1);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  selectedCategory === "all"
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>🛍️ All Products</span>
                <span className="text-xs bg-slate-800/80 px-2 py-0.5 rounded-full">
                  {initialProducts.length}
                </span>
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
                All Categories
              </span>
              <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
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
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                        selectedCategory.toLowerCase() === cat.name.toLowerCase()
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] text-slate-500">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Instant Crypto & Digital Store
        </div>
      </aside>

      {/* মূল ফুল-পেজ কনটেন্ট */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 w-full">
        {/* টপ হেডার ও ৩ লাইনের হ্যামবার্গার বাটন */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-slate-300 hover:text-white transition cursor-pointer shrink-0 shadow-md"
            title="Open Menu"
          >
            {/* ৩ লাইনের মেনু আইকন */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Instant Digital Delivery
            </h1>
            <p className="text-xs text-slate-400">
              Select your gaming credits, gift cards & license keys.
            </p>
          </div>
        </div>

        {/* সার্চবার */}
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search products by title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition shadow-inner"
          />
          <span className="absolute left-4 top-3 text-slate-500 text-sm">🔍</span>
        </div>

        {/* সার্চবারের নিচে ১ লাইনে ৬টি করে ক্যাটাগরি কার্ড */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Popular Categories
            </h2>
            {categories.length > 12 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition"
              >
                {showAllCategories ? "Show Less ↑" : `Show More (${categories.length - 12} more) ↓`}
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
                className={`group flex flex-col items-center p-3 rounded-2xl border text-center transition duration-200 ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? "bg-sky-500/10 border-sky-500 text-sky-400 shadow-md shadow-sky-950"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200"
                }`}
              >
                <div className="w-14 h-14 mb-2 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center group-hover:scale-105 transition">
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

        {/* প্রোডাক্ট গ্রিড (সর্বোচ্চ ৩০টি) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
            <div>
              <h2 className="text-lg font-bold text-white capitalize">
                {selectedCategory === "all" ? "All Products" : `${selectedCategory} Products`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {displayedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl overflow-hidden flex flex-col group transition duration-200 shadow-lg"
                >
                  <div className="h-36 bg-slate-800 relative overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-slate-600 text-xs">No Image</span>
                    )}
                    <span className="absolute top-2 right-2 bg-slate-950/80 text-sky-400 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ${product.price}
                    </span>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {product.category}
                      </span>
                      <h3 className="text-xs font-bold text-white line-clamp-2 mt-0.5 group-hover:text-sky-400 transition">
                        {product.title}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Instant Access</span>
                      <span className="text-sky-400 font-semibold group-hover:underline">Buy Now →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* পেজিনেশন */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                    currentPage === page
                      ? "bg-sky-500 text-white"
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