"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number | string;
  title: string;
  price: number;
  category: string;
  image_url: string;
  description: string;
  views?: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "Software & Tools",
    "Web Templates",
    "E-books & Guides",
    "Audio & SFX",
  ]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);

        // Fetch Categories
        const { data: catData } = await supabase
          .from("categories")
          .select("name")
          .order("name", { ascending: true });

        if (catData && catData.length > 0) {
          setCategories(catData.map((c: { name: string }) => c.name));
        }

        // Fetch Products
        const { data: prodData, error } = await supabase
          .from("products")
          .select("*")
          .order("id", { ascending: false });

        if (!error && prodData) {
          setProducts(prodData);
        }
      } catch (err) {
        console.error("Error loading store data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // Filter products by Category and Search query
  const filteredProducts = products.filter((item) => {
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Top Store Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-900 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black text-sky-400 tracking-tight">
            ShovoStore.
          </Link>

          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, tools, guides..."
              className="w-full bg-slate-900 border border-slate-800 rounded-full pl-4 pr-10 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-sky-500 transition placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-5 text-xs sm:text-sm font-semibold text-slate-400">
            <a href="#products" className="hover:text-white transition">Products</a>
            <a href="#categories" className="hover:text-white transition">Categories</a>
            <Link
              href="/admin"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl transition text-xs font-bold"
            >
              Admin Access
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-4 pt-6">
          <div className="inline-block bg-sky-500/10 border border-sky-500/20 px-4 py-1 rounded-full text-xs font-semibold text-sky-400">
            Verified Digital Assets Platform
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Explore Premium Digital Assets <br />
            <span className="text-sky-400">With Instant Download</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
            Get instant access to authentic licenses, web templates, and technical resources with zero waiting time.
          </p>
        </section>

        {/* Product Catalog Section */}
        <section id="products" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Marketplace Catalog</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing {filteredProducts.length} verified products
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
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
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">
              Loading marketplace inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-slate-900 rounded-2xl">
              <p className="text-sm text-slate-400">No products found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-sky-500/50 transition duration-300 flex flex-col justify-between group shadow-md"
                >
                  {/* Image Container */}
                  <div className="relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-36 sm:h-44 bg-slate-800 flex items-center justify-center text-xs text-slate-500 font-bold">
                        No Preview Image
                      </div>
                    )}
                    <span className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur text-slate-300 text-[10px] px-2 py-0.5 rounded-md border border-slate-800">
                      👁️ {item.views || 0}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-grow justify-between">
                    <div>
                      <span className="text-[10px] text-sky-400 uppercase tracking-wider font-bold">
                        {item.category || "Digital Asset"}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1 line-clamp-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-base font-extrabold text-sky-400">
                        ${item.price}
                      </span>
                      <Link
                        href={`/product/${item.id}`}
                        className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition active:scale-95"
                      >
                        Buy Now →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Categories Section */}
        <section id="categories" className="space-y-4 pt-4 border-t border-slate-900">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold">Browse Categories</h2>
            <p className="text-xs text-slate-400 mt-1">Select a category to filter the store</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }}
                className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-4 rounded-xl text-center text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-slate-900 text-xs text-slate-600 mt-16">
        © 2026 ShovoStore — All rights reserved.
      </footer>
    </div>
  );
}