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

        const { data: catData } = await supabase
          .from("categories")
          .select("name")
          .order("name", { ascending: true });

        if (catData && catData.length > 0) {
          setCategories(catData.map((c: { name: string }) => c.name));
        }

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

  const filteredProducts = products.filter((item) => {
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-900 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="text-xl font-black text-sky-400 tracking-tight">
            ShovoStore.
          </Link>

          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, tools, gift cards..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3.5 pr-9 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-sky-500 transition placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <a href="#products" className="hover:text-white transition">Products</a>
            <a href="#categories" className="hover:text-white transition">Categories</a>
            <Link
              href="/admin"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition text-xs font-bold"
            >
              Admin Access
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Catalog */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-8">
        <section id="products" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-900 pb-3">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">Marketplace Catalog</h1>
              <p className="text-xs text-slate-400">
                Showing {filteredProducts.length} verified products
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-sky-500 text-white shadow"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                All Products
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-sky-500 text-white shadow"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500 text-sm font-medium">
              Loading catalog inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-900 rounded-lg">
              <p className="text-sm text-slate-400">No products found matching your criteria.</p>
            </div>
          ) : (
            <>
              {/* ১. DESKTOP VIEW: কার্ডের যেকোনো জায়গায় (ছবি, নাম, বাটন) ক্লিক করলেই প্রোডাক্ট পেজ খুলবে */}
              <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 items-stretch">
                {filteredProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hover:border-sky-500 transition duration-200 flex flex-col justify-between group shadow-sm cursor-pointer block"
                  >
                    {/* কার্ডের ছবি */}
                    <div className="relative bg-slate-950 border-b border-slate-800/80">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-28 object-cover group-hover:scale-105 transition duration-200"
                        />
                      ) : (
                        <div className="w-full h-28 bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                          No Image
                        </div>
                      )}
                      <span className="absolute top-1.5 right-1.5 bg-slate-950/80 backdrop-blur text-slate-300 text-[9px] px-1.5 py-0.5 rounded border border-slate-800">
                        👁️ {item.views || 0}
                      </span>
                    </div>

                    {/* কার্ডের নাম (ডেসক্রিপশন নেই, পুরো নাম একাধিক লাইনে শো করবে) */}
                    <div className="p-2.5 flex flex-col flex-grow justify-between">
                      <div>
                        <span className="text-[9px] text-sky-400 uppercase tracking-wider font-bold block mb-1">
                          {item.category || "Digital Asset"}
                        </span>
                        <h2 className="text-xs font-bold text-white leading-snug whitespace-normal break-words">
                          {item.title}
                        </h2>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
                        <span className="text-sm font-black text-sky-400">
                          ${item.price}
                        </span>
                        <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded transition whitespace-nowrap">
                          Buy Now
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* ২. MOBILE VIEW: পুরো রো-তে ক্লিক করলেই প্রোডাক্ট পেজ খুলবে */}
              <div className="flex flex-col gap-2.5 sm:hidden">
                {filteredProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-3 hover:border-slate-700 active:bg-slate-800/60 transition shadow-sm cursor-pointer block"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* ছবি */}
                      <div className="w-16 h-16 bg-slate-950 rounded border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-500 font-bold">No Image</span>
                        )}
                      </div>

                      {/* নাম */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider block">
                          {item.category || "Digital Asset"}
                        </span>
                        <h2 className="text-xs font-bold text-white leading-snug mt-0.5 whitespace-normal break-words">
                          {item.title}
                        </h2>
                        <span className="text-[9px] text-slate-500 mt-1 block">
                          👁️ {item.views || 0} views
                        </span>
                      </div>
                    </div>

                    {/* দাম ও বাটন */}
                    <div className="flex flex-col items-end justify-center shrink-0 pl-1">
                      <span className="text-sm font-black text-sky-400 mb-1.5">
                        ${item.price}
                      </span>
                      <span className="bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded transition text-center shadow whitespace-nowrap">
                        Buy Now
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Categories Section */}
        <section id="categories" className="space-y-3 pt-4 border-t border-slate-900">
          <div>
            <h2 className="text-base font-bold text-white">Categories</h2>
            <p className="text-xs text-slate-400">Filter inventory by department</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-3 rounded-lg text-center text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center py-6 border-t border-slate-900 text-xs text-slate-600 mt-12">
        © 2026 ShovoStore — All rights reserved.
      </footer>
    </div>
  );
}