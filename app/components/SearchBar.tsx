"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Product {
  id: number | string;
  title?: string;
  price: number;
  category?: string;
  image_url?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      const clean = query.trim();
      if (!clean) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, title, price, category, image_url")
        .ilike("title", `%${clean}%`)
        .limit(6);

      if (data) {
        setResults(data);
        setIsOpen(true);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(searchProducts, 250);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search digital assets, software, templates..."
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
            className="absolute right-28 text-xs text-slate-500 hover:text-white transition"
          >
            ✕
          </button>
        )}

        <button
          type="button"
          className="absolute right-1 top-1 bottom-1 px-4 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search</span>
        </button>
      </div>

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
            results.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 hover:bg-slate-800/80 transition group"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] text-slate-500 font-bold shrink-0">
                    No Img
                  </div>
                )}
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-sky-400 transition">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    {item.category || "Asset"}
                  </span>
                </div>
                <span className="text-xs font-bold text-sky-400 shrink-0">
                  ${item.price}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}