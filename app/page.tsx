"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  views: number;
}

export default function Home() {
  const [categories, setCategories] = useState([
    "ই-বুক ও গাইড",
    "সফটওয়্যার ও টুলস",
    "ওয়েব টেমপ্লেট",
    "অডিও ও সাউন্ড ইফেক্ট",
  ]);
  const [newCat, setNewCat] = useState("");
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // সর্বাধিক ভিজিট হওয়া সেরা ১০টি প্রোডাক্ট লোড করা
  useEffect(() => {
    const fetchTopProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("views", { ascending: false })
        .order("id", { ascending: false })
        .limit(10);

      if (data) setTopProducts(data);
      setLoading(false);
    };

    fetchTopProducts();
  }, []);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
      setNewCat("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* হেডার / নেভবার */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <span className="text-xl font-bold text-sky-400">শুভস্টোর.</span>
        <div className="flex gap-6 text-sm text-slate-400">
          <a href="#hero" className="hover:text-white transition">হোম</a>
          <a href="#popular" className="hover:text-white transition">জনপ্রিয়</a>
          <a href="#categories" className="hover:text-white transition">ক্যাটাগরি</a>
          <a href="#about" className="hover:text-white transition">আমাদের সম্পর্কে</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-20">
        {/* হিরো সেকশন */}
        <section id="hero" className="text-center space-y-4 pt-8">
          <div className="inline-block bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 rounded-full text-xs font-medium text-sky-400">
            প্রিমিয়াম ডিজিটাল অ্যাসেট হাব
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            সেরা ডিজিটাল রিসোর্স কিনুন <br />
            <span className="text-sky-400">একদম নির্ভরযোগ্যভাবে</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            প্রোগ্রামিং গাইড, সফটওয়্যার লাইসেন্স ও প্রিমিয়াম টেমপ্লেট সংগ্রহ করুন তাৎক্ষণিক ডাউনলোডের সুবিধা সহ।
          </p>
        </section>

        {/* 🔥 সর্বাধিক ভিজিট হওয়া সেরা ১০টি প্রোডাক্ট সেকশন 🔥 */}
        <section id="popular" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-900 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full mb-2">
                🔥 ট্রেন্ডিং ও সর্বাধিক জনপ্রিয়
              </div>
              <h2 className="text-2xl font-bold text-white">সেরা ১০টি প্রোডাক্ট</h2>
              <p className="text-xs text-slate-400 mt-1">
                ভিজিটরদের সবচেয়ে বেশি দেখা ও চাহিদাসম্পন্ন আইটেমসমূহ
              </p>
            </div>
            <span className="text-xs text-slate-500">স্বয়ংক্রিয় র‍্যাঙ্কিং</span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 text-center py-10">প্রোডাক্ট লোড হচ্ছে...</p>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {topProducts.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-sky-500/50 transition duration-300 flex flex-col justify-between group shadow-lg"
                >
                  <div className="relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-44 bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                        ছবি নেই
                      </div>
                    )}
                    {/* র‍্যাঙ্ক ব্যাজ */}
                    <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur text-amber-400 font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-400/30">
                      #{index + 1}
                    </span>
                    {/* ভিউ সংখ্যা */}
                    <span className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur text-slate-300 text-[10px] px-2 py-1 rounded-lg border border-slate-800">
                      👁️ {item.views || 0}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-grow justify-between">
                    <div>
                      <span className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-semibold text-white mt-1 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-base font-bold text-sky-400">
                        ৳{item.price}
                      </span>
                      <Link
                        href={`/product/${item.id}`}
                        className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        কিনুন →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ক্যাটাগরি সেকশন */}
        <section id="categories" className="text-center space-y-6 pt-6">
          <div>
            <h2 className="text-2xl font-bold">প্রোডাক্ট ক্যাটাগরি</h2>
            <p className="text-xs text-slate-400 mt-1">
              ক্যাটাগরির ওপর ক্লিক করে ভেতরে প্রবেশ করুন অথবা নতুন ক্যাটাগরি যুক্ত করুন
            </p>
          </div>

          <form onSubmit={handleAddCategory} className="flex justify-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="নতুন ক্যাটাগরির নাম লিখুন..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500 flex-grow"
            />
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs px-4 py-2 rounded-lg font-semibold transition"
            >
              + যোগ করুন
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

        {/* আমাদের সম্পর্কে */}
        <section id="about" className="text-center pt-8 border-t border-slate-900">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">আমাদের সম্পর্কে</h3>
          <div className="inline-block bg-slate-900/60 border border-slate-800 px-6 py-3 rounded-xl text-xs text-slate-400">
            <span className="text-sky-400 font-semibold">শুভ স্টোর</span> হলো একটি সম্পূর্ণ স্বয়ংক্রিয় এবং ক্লাউড-সংরক্ষিত ডিজিটাল মার্কেটপ্লেস।
          </div>
        </section>
      </div>

      {/* ফুটার */}
      <footer className="text-center py-6 border-t border-slate-900 text-xs text-slate-600">
        © ২০২৬ শুভ স্টোর — সর্বস্বত্ব সংরক্ষিত।
      </footer>
    </div>
  );
}