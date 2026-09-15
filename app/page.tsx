"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number | string;
  title?: string;
  name?: string;
  category?: string;
  price: number;
  description?: string;
  image_url?: string;
  image?: string;
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
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [newCat, setNewCat] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories and products from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch categories from Supabase (synced with admin panel)
      const { data: catData } = await supabase
        .from("categories")
        .select("name")
        .order("name", { ascending: true });

      if (catData && catData.length > 0) {
        setCategories(catData.map((c: CategoryItem) => c.name));
      }

      // 2. Fetch products sorted by views & recent IDs
      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .order("views", { ascending: false })
        .order("id", { ascending: false });

      if (prodData) {
        setAllProducts(prodData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Add a new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCat = newCat.trim();
    if (!cleanCat) return;

    await supabase.from("categories").insert([{ name: cleanCat }]);

    if (!categories.includes(cleanCat)) {
      setCategories([...categories, cleanCat]);
    }
    setNewCat("");
  };

  // Filter products based on selected category
  const displayedProducts =
    selectedCategory === "ALL"
      ? allProducts.slice(0, 10) // Show top 10 products when "ALL" is selected
      : allProducts.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Header / Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <span className="text-xl font-black text-sky-400 tracking-tight">ShovoStore.</span>
        <div className="flex gap-6 text-sm text-slate-400 font-medium">
          <a href="#hero" className="hover:text-white transition">Home</a>
          <a href="#popular" className="hover:text-white transition">Popular</a>
          <a href="#categories" className="hover:text-white transition">Categories</a>
          <a href="#about" className="hover:text-white transition">About Us</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-20">
        {/* Hero Section */}
        <section id="hero" className="text-center space-y-4 pt-8">
          <div className="inline-block bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-sky-400">
            Premium Digital Asset Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Discover Top Digital Resources <br />
            <span className="text-sky-400">With Complete Reliability</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Get instant access to programming guides, verified software licenses, and premium web templates with instant downloads.
          </p>
        </section>

        {/* 🔥 Popular Products & Category Filter Section 🔥 */}
        <section id="popular" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-900 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full mb-2">
                🔥 Trending & Most Popular
              </div>
              <h2 className="text-2xl font-bold text-white">
                {selectedCategory === "ALL"
                  ? "Top 10 Products"
                  : `Products in "${selectedCategory}"`}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Highest demanded and most viewed items by our visitors
              </p>
            </div>

            {/* Category Filter Buttons */}
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
            <p className="text-sm text-slate-500 text-center py-10">Loading products...</p>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-900 rounded-2xl">
              <p className="text-sm text-slate-400">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedProducts.map((item, index) => {
                const title = item.title || item.name || "Untitled Product";
                const img = item.image_url || item.image;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-sky-500/50 transition duration-300 flex flex-col justify-between group shadow-lg"
                  >
                    <div className="relative">
                      {img ? (
                        <img
                          src={img}
                          alt={title}
                          className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-44 bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                          No Image
                        </div>
                      )}
                      {/* Rank Badge */}
                      <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur text-amber-400 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-400/30">
                        #{index + 1}
                      </span>
                      {/* View Counter */}
                      <span className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur text-slate-300 text-[10px] px-2 py-1 rounded-lg border border-slate-800">
                        👁️ {item.views || 0}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col flex-grow justify-between">
                      <div>
                        <span className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold">
                          {item.category || "Digital"}
                        </span>
                        <h3 className="text-sm font-semibold text-white mt-1 line-clamp-1">
                          {title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-base font-bold text-sky-400">
                          ৳{item.price}
                        </span>
                        <Link
                          href={`/product/${item.id}`}
                          className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
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

        {/* Categories Section */}
        <section id="categories" className="text-center space-y-6 pt-6">
          <div>
            <h2 className="text-2xl font-bold">Product Categories</h2>
            <p className="text-xs text-slate-400 mt-1">
              Click on a category to explore or create a new category below
            </p>
          </div>

          <form onSubmit={handleAddCategory} className="flex justify-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Enter new category name..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500 flex-grow"
            />
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs px-4 py-2 rounded-lg font-semibold transition cursor-pointer"
            >
              + Add Category
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${encodeURIComponent(cat)}`}
                className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-4 rounded-xl text-center text-sm font-medium transition group flex items-center justify-between px-5"
              >
                <span>{cat}</span>
                <span className="text-slate-500 group-hover:text-sky-400 transition">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="text-center pt-8 border-t border-slate-900">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">About Us</h3>
          <div className="inline-block bg-slate-900/60 border border-slate-800 px-6 py-3 rounded-xl text-xs text-slate-400">
            <span className="text-sky-400 font-semibold">ShovoStore</span> is a fully automated, cloud-powered digital asset marketplace.
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-xs text-slate-600">
        © 2026 ShovoStore — All rights reserved.
      </footer>
    </div>
  );
}