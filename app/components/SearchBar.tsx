"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number | string;
  title?: string;
  price: number;
  discount_price?: number | null;
  discount_until?: string | null;
  delivery_type?: "auto" | "manual";
  category?: string;
  image_url?: string;
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ করার লিসেনার
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // লাইভ ড্রপডাউন সাজেশন (মাল্টি-কীওয়ার্ড টোকেনাইজড সার্চ)
  useEffect(() => {
    const searchProducts = async () => {
      const clean = query.trim();
      if (!clean) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);

      const words = clean
        .split(/\s+/)
        .map((w) => w.replace(/[,()]/g, "").trim())
        .filter(Boolean);

      if (words.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        const orConditions = words
          .flatMap((w) => [`title.ilike.%${w}%`, `category.ilike.%${w}%`])
          .join(",");

        const { data } = await supabase
          .from("products")
          .select("id, title, price, discount_price, discount_until, delivery_type, category, image_url")
          .or(orConditions)
          .limit(40);

        if (data) {
          const matchedResults = data
            .filter((item) => {
              const target = `${item.title || ""} ${item.category || ""}`.toLowerCase();
              return words.every((word) => target.includes(word.toLowerCase()));
            })
            .slice(0, 6);

          setResults(matchedResults);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 250);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // এন্টার বাটন অথবা সার্চ বাটনে চাপলে সরাসরি সার্চ পেজে রিডাইরেক্ট
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setIsOpen(false); // ড্রপডাউন বন্ধ করবে
    router.push(`/products?search=${encodeURIComponent(clean)}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto">
      {/* ফর্ম দিয়ে র‍্যাপ করা হয়েছে যাতে কীবোর্ডের Enter কাজ করে */}
      <form onSubmit={handleManualSearch} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search game keys, gift cards, software..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-full pl-5 pr-28 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-sky-500 transition shadow-inner placeholder:text-slate-500"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-28 text-xs text-slate-500 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        )}

        {/* সাবমিট বাটন (ক্লিক করলে বা Enter চাপলে কাজ করবে) */}
        <button
          type="submit"
          className="absolute right-1 top-1 bottom-1 px-4 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search</span>
        </button>
      </form>

      {/* Live Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400 font-medium">
              Searching marketplace...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              No products found for "{query}".
            </div>
          ) : (
            results.map((item) => {
              const hasDiscount = Boolean(
                item.discount_price &&
                item.discount_price < item.price &&
                (!item.discount_until || new Date(item.discount_until) > new Date())
              );

              return (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 hover:bg-slate-800/80 transition group"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title || "Product"}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500 shrink-0">
                      🎮
                    </div>
                  )}

                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-sky-400 transition">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {item.category || "Item"}
                      </span>
                      {item.delivery_type === "manual" && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold">
                          🕒 Manual
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {hasDiscount ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] line-through text-slate-500">
                          ${item.price}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          ${item.discount_price}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-sky-400">
                        ${item.price}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}