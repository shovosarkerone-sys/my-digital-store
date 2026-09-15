"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number | string;
  title?: string;
  category?: string;
  price: number;
  description?: string;
  image_url?: string;
  views?: number;
}

interface CategoryItem {
  id?: number | string;
  name: string;
}

export default function Home() {
  const [categories, setCategories] = useState<string[]>([
    "E-books & Guides",
    "Software & Tools",
    "Web Templates",
    "Audio & Sound Effects",
  ]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: catData } = await supabase
          .from("categories")
          .select("name")
          .order("name", { ascending: true });

        if (catData && catData.length > 0) {
          setCategories(catData.map((c: CategoryItem) => c.name));
        }

        const { data: prodData } = await supabase
          .from("products")
          .select("*")
          .order("views", { ascending: false })
          .order("id", { ascending: false });

        if (prodData) {
          setAllProducts(prodData);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayedProducts =
    selectedCategory === "ALL"
      ? allProducts.slice(0, 12)
      : allProducts.filter((item) => item.category === selectedCategory);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase().trim())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-16 selection:bg-sky-500 selection:text-white">
      {/* Hero Section */}
      <section id="hero" className="text-center space-y-4 pt-4 sm:pt-8">
        <div className="inline-block bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-sky-400">
          Verified Digital Assets Marketplace
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Discover Premium Digital Assets <br />
          <span className="text-sky-400">With Instant Delivery</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
          Access verified software licenses, expert guides, and high-performance web templates ready for immediate production download.
        </p>
      </section>

      {/* Top 12 Popular Products */}
      <section id="popular" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-900 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full mb-2">
              🔥 Trending & Most Popular
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {selectedCategory === "ALL"
                ? "Top 12 Products"
                : `Products in "${selectedCategory}"`}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Highest rated and most demanded assets by verified visitors
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              All Products
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 text-center py-10">Loading catalog...</p>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-900 rounded-2xl">
            <p className="text-sm text-slate-400 font-medium">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {displayedProducts.map((item, index) => {
              const title = item.title || "Untitled Asset";
              const img = item.image_url;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden hover:border-sky-500/50 transition duration-300 flex flex-col justify-between group shadow-md"
                >
                  <div className="relative">
                    {img ? (
                      <img
                        src={img}
                        alt={title}
                        className="w-full h-32 sm:h-36 md:h-40 object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-32 sm:h-36 md:h-40 bg-slate-800 flex items-center justify-center text-[11px] text-slate-500 font-medium">
                        No Preview Image
                      </div>
                    )}

                    <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur text-amber-400 font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border border-amber-400/30">
                      #{index + 1}
                    </span>

                    <span className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur text-slate-300 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md border border-slate-800">
                      👁️ {item.views || 0}
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 flex flex-col flex-grow justify-between">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-sky-400 uppercase tracking-wider font-bold">
                        {item.category || "Digital Asset"}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white mt-1 line-clamp-1">
                        {title}
                      </h3>
                      {item.description && (
                        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs sm:text-sm md:text-base font-extrabold text-sky-400">
                        ${item.price}
                      </span>
                      <Link
                        href={`/product/${item.id}`}
                        className="bg-sky-500 hover:bg-sky-600 text-white text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition active:scale-95"
                      >
                        Buy Now →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Product Categories Section */}
      <section id="categories" className="text-center space-y-6 pt-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Product Categories</h2>
          <p className="text-xs text-slate-400 mt-1">
            Search and select a category to browse targeted products
          </p>
        </div>

        <div className="max-w-md mx-auto relative flex items-center px-2 sm:px-0">
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full bg-slate-900 border border-slate-800 rounded-full pl-5 pr-36 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 shadow-inner placeholder:text-slate-500"
          />

          {categorySearch && (
            <button
              type="button"
              onClick={() => setCategorySearch("")}
              className="absolute right-36 text-xs text-slate-500 hover:text-white transition"
            >
              ✕
            </button>
          )}

          <button
            type="button"
            className="absolute right-3 sm:right-1 top-1 bottom-1 px-4 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search Category</span>
          </button>
        </div>

        {filteredCategories.length === 0 ? (
          <p className="text-xs text-slate-500 py-6">
            No categories found matching "{categorySearch}".
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {filteredCategories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${encodeURIComponent(cat)}`}
                className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-3 sm:p-4 rounded-xl text-center text-xs sm:text-sm font-medium transition group flex items-center justify-between px-4"
              >
                <span className="truncate">{cat}</span>
                <span className="text-slate-500 group-hover:text-sky-400 transition ml-2">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* About Us Section */}
      <section id="about" className="text-center pt-8 border-t border-slate-900">
        <h3 className="text-sm font-semibold text-slate-400 mb-2">About Us</h3>
        <div className="inline-block bg-slate-900/60 border border-slate-800 px-6 py-3 rounded-xl text-xs text-slate-400">
          <span className="text-sky-400 font-semibold">ShovoStore</span> is a high-speed, cloud-powered digital asset marketplace built for reliable automated deliveries.
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-xs text-slate-600">
        © 2026 ShovoStore — All rights reserved.
      </footer>
    </div>
  );
}