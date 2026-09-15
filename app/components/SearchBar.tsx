'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Product {
  id: string | number;
  name?: string;
  title?: string;
  price?: number;
  image_url?: string;
  image?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ডাটাবেস থেকে প্রোডাক্ট খোঁজার মূল ফাংশন
  const searchProducts = async (searchTerm: string) => {
    const cleanTerm = searchTerm.trim();
    if (!cleanTerm) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      // ১. প্রথমে 'name' কলাম দিয়ে খোঁজার চেষ্টা
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${cleanTerm}%`)
        .limit(6);

      // ২. যদি 'name' কলাম না থাকে বা রেজাল্ট না আসে, তবে 'title' কলামে খুঁজবে
      if (error || !data || data.length === 0) {
        const fallback = await supabase
          .from('products')
          .select('*')
          .ilike('title', `%${cleanTerm}%`)
          .limit(6);

        if (fallback.data && fallback.data.length > 0) {
          data = fallback.data;
        }
      }

      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // টাইপ করার সময় অটোমেটিক সাজেশন (৩০০ms বিরতিতে)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // সার্চ বাটনে ক্লিক করলে বা Enter চাপলে তাৎক্ষণিক সার্চ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchProducts(query);
    }
  };

  // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ হওয়া
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="প্রোডাক্টের নাম লিখুন..."
          className="w-full pl-4 pr-24 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />

        {/* নীল Search বাটন */}
        <button
          type="submit"
          className="absolute right-1 top-1 bottom-1 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>Search</span>
        </button>
      </form>

      {/* ড্রপডাউন সাজেশন লিস্ট */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
              খোঁজা হচ্ছে...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {results.map((product) => {
                const displayName = product.name || product.title || 'নামহীন প্রোডাক্ট';
                const displayImage = product.image_url || product.image;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 hover:bg-blue-50/60 transition-colors"
                  >
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={displayName}
                        className="w-11 h-11 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                        ছবি নেই
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {displayName}
                      </p>
                      {product.price !== undefined && (
                        <p className="text-xs text-blue-600 font-bold mt-0.5">
                          ৳ {product.price}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">
              "{query}" নামে কোনো প্রোডাক্ট পাওয়া যায়নি
            </div>
          )}
        </div>
      )}
    </div>
  );
}