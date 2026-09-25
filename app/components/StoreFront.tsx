"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  discount_price?: number | null;
  discount_until?: string | null;
  delivery_type?: "auto" | "manual";
  description: string;
  image_url: string | null;
  views?: number;
  seller_id?: string | null;
  seller_name?: string | null;
  voucher_codes?: string | null;
  sold_count?: number;
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
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("latest");
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState<boolean>(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 30;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function checkUserStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        setIsSeller(!!sellerData);
      }
    }

    checkUserStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        setIsSeller(!!sellerData);
      } else {
        setIsSeller(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    const cleanQuery = searchQuery.trim().toLowerCase();
    if (cleanQuery) {
      const searchWords = cleanQuery.split(/\s+/).filter(Boolean);
      result = result.filter((product) => {
        const targetText = `${product.title} ${product.category}`.toLowerCase();
        return searchWords.every((word) => targetText.includes(word));
      });
    }

    result.sort((a, b) => {
      const priceA =
        a.discount_price &&
        a.discount_price < a.price &&
        (!a.discount_until || new Date(a.discount_until) > new Date())
          ? a.discount_price
          : a.price;
      const priceB =
        b.discount_price &&
        b.discount_price < b.price &&
        (!b.discount_until || new Date(b.discount_until) > new Date())
          ? b.discount_price
          : b.price;

      switch (sortOption) {
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "latest":
        default:
          return b.id - a.id;
      }
    });

    return result;
  }, [initialProducts, searchQuery, sortOption]);

  const instantSuggestions = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    if (!cleanQuery) return [];

    const searchWords = cleanQuery.split(/\s+/).filter(Boolean);

    return initialProducts
      .filter((product) => {
        const targetText = `${product.title} ${product.category}`.toLowerCase();
        return searchWords.every((word) => targetText.includes(word));
      })
      .slice(0, 6);
  }, [initialProducts, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 12);

  const getStockCount = (voucherCodes?: string | null) => {
    if (!voucherCodes) return 0;
    return voucherCodes
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0).length;
  };

  // পরিবর্তিত সার্চ সাবমিট ফাংশন
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (clean) {
      setIsSearchFocused(false);
      router.push(`/search?q=${encodeURIComponent(clean)}`);
    }
  };

  const currentThemeLabel = !mounted
    ? "System"
    : theme === "light"
    ? "Light"
    : theme === "dark"
    ? "Dark"
    : "System";

  const currentThemeIcon = !mounted
    ? "💻"
    : theme === "light"
    ? "☀️"
    : theme === "dark"
    ? "🌙"
    : "💻";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-sky-500 selection:text-white transition-colors duration-200">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 py-3 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? (
              <span className="text-base font-bold text-sky-500 dark:text-sky-400 leading-none">✕</span>
            ) : (
              <>
                <span className="w-5 h-0.5 bg-slate-700 dark:bg-slate-200 rounded-full"></span>
                <span className="w-5 h-0.5 bg-slate-700 dark:bg-slate-200 rounded-full"></span>
                <span className="w-5 h-0.5 bg-slate-700 dark:bg-slate-200 rounded-full"></span>
              </>
            )}
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/icon.png"
              alt="Inskeys"
              width={38}
              height={38}
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0 transition-transform group-hover:scale-105 bg-transparent"
            />
            <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-none">
              Inskeys
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isSeller && (
            <Link
              href="/seller-dashboard"
              className="text-xs font-bold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              Seller Dashboard
            </Link>
          )}

          {currentUser ? (
            <Link
              href="/dashboard"
              className="text-xs font-bold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-black">
                {currentUser.user_metadata?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="max-w-[80px] truncate hidden sm:inline">
                {currentUser.user_metadata?.full_name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth"
              className="text-xs font-bold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 text-slate-900 dark:text-white px-3.5 py-2 rounded-xl transition cursor-pointer shadow-sm"
            >
              Log In
            </Link>
          )}
        </div>
      </header>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Navigation Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Image
              src="/icon.png"
              alt="Inskeys"
              width={40}
              height={40}
              className="w-10 h-10 object-contain shrink-0 bg-transparent"
            />
            <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-none">
              Inskeys
            </span>
          </div>

          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-4 flex-1 overflow-y-auto pr-1 flex flex-col">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 px-2">
              Browse Menu
            </span>
            <div className="space-y-2">
              {isSeller ? (
                <Link
                  href="/seller-dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition cursor-pointer"
                >
                  <span>Seller Dashboard</span>
                  <span>→</span>
                </Link>
              ) : (
                <Link
                  href="/become-seller"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition cursor-pointer"
                >
                  <span>Become a Seller</span>
                  <span>→</span>
                </Link>
              )}

              <Link
                href="/products"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition cursor-pointer"
              >
                <span>All Products</span>
                <span className="text-[11px] bg-sky-600/80 px-2 py-0.5 rounded-full font-mono">
                  {initialProducts.length}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setIsCategoriesMenuOpen(!isCategoriesMenuOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <span>Categories</span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span className="bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-800">
                    {categories.length}
                  </span>
                  <span>{isCategoriesMenuOpen ? "▲" : "▼"}</span>
                </span>
              </button>

              {isCategoriesMenuOpen && (
                <div className="mt-2 space-y-1 max-h-56 overflow-y-auto pl-1 pr-1 bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2 border border-slate-200 dark:border-slate-800/80">
                  {categories.map((cat) => {
                    const count = initialProducts.filter(
                      (p) => p.category.toLowerCase() === cat.name.toLowerCase()
                    ).length;

                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${encodeURIComponent(cat.name)}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <Link
                href="/about"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <span>About Inskeys</span>
                <span>📖</span>
              </Link>
            </div>
          </div>

          {/* Bottom Section (Log In & Real Theme Switcher) */}
          <div className="mt-auto pt-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
            {!currentUser && (
              <Link
                href="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                Log In / Register
              </Link>
            )}

            {/* Theme Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{currentThemeIcon}</span>
                  <span>Theme: {currentThemeLabel}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isThemeDropdownOpen ? "▲" : "▼"}
                </span>
              </button>

              {isThemeDropdownOpen && (
                <div className="mt-2 space-y-1 bg-slate-50 dark:bg-slate-950/80 rounded-xl p-2 border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setTheme("light");
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      theme === "light"
                        ? "bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>☀️</span> Light
                  </button>
                  <button
                    onClick={() => {
                      setTheme("dark");
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      theme === "dark"
                        ? "bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>🌙</span> Dark
                  </button>
                  <button
                    onClick={() => {
                      setTheme("system");
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      theme === "system"
                        ? "bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>💻</span> System Default
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Container */}
      <main className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full space-y-10">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold">
            🛡️ 36-Hour Buyer Protection Guarantee
          </div>

          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              <span className="text-slate-900 dark:text-white">Premium Digital </span>
              <span className="bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 dark:from-sky-400 dark:via-sky-300 dark:to-blue-500 bg-clip-text text-transparent">
                Marketplace
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
              Explore game keys, digital vouchers, and activation licenses with verified crypto checkout.
            </p>
          </div>

          {/* Live Search Bar */}
          <div className="relative w-full max-w-2xl text-left mt-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
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
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-2xl py-3.5 pl-12 pr-32 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition duration-200 shadow-sm dark:shadow-xl"
              />
              <span className="absolute left-4 text-slate-400 dark:text-slate-500 text-base">🔍</span>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-24 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}

              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
              >
                <span>Search</span>
              </button>
            </form>

            {/* Instant Suggestions Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-40 divide-y divide-slate-100 dark:divide-slate-800/70">
                {instantSuggestions.length > 0 ? (
                  <>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-4">
                      <span>Matching Suggestions ({instantSuggestions.length})</span>
                      <span className="text-sky-500 dark:text-sky-400 text-[10px]">Instant View</span>
                    </div>
                    {instantSuggestions.map((item) => {
                      const hasDiscount = Boolean(
                        item.discount_price &&
                          item.discount_price < item.price &&
                          (!item.discount_until || new Date(item.discount_until) > new Date())
                      );

                      return (
                        <Link
                          key={item.id}
                          href={`/product/${item.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition group"
                        >
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              />
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-600">🎮</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition truncate">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {item.category}
                              </span>
                              {item.delivery_type === "manual" && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 rounded font-semibold">
                                  🕒 Manual
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {hasDiscount ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] line-through text-slate-400 dark:text-slate-500">
                                  ${item.price}
                                </span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                                  ${item.discount_price}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-black text-sky-500 dark:text-sky-400 block">
                                ${item.price}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No instant suggestions for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Popular Categories
            </h2>
            {categories.length > 12 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 font-semibold transition cursor-pointer"
              >
                {showAllCategories
                  ? "Show Less ↑"
                  : `Show More (${categories.length - 12} more) ↓`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visibleCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-center transition duration-200 cursor-pointer shadow-sm dark:shadow-md"
              >
                <div className="w-14 h-14 mb-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center group-hover:scale-105 transition duration-200">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">🎮</span>
                  )}
                </div>
                <span className="text-xs font-semibold truncate w-full text-slate-800 dark:text-slate-200 group-hover:text-sky-500 dark:group-hover:text-sky-400">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Products Showcase */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800/80 pt-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Available Products</h2>
              <p className="text-xs text-slate-500">
                Showing {displayedProducts.length} of {filteredProducts.length} items
              </p>
            </div>

            {/* Sorting Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto appearance-none bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300 text-xs font-semibold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer shadow-sm"
              >
                <option value="latest">Sort by: Latest Added</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none text-[10px]">
                ▼
              </span>
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-sm shadow-sm">
              No products found matching your criteria.
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {displayedProducts.map((product) => {
                const stock = getStockCount(product.voucher_codes);
                const isOfficial = !product.seller_id || product.seller_name === "Official Store";

                const hasDiscount = Boolean(
                  product.discount_price &&
                    product.discount_price < product.price &&
                    (!product.discount_until || new Date(product.discount_until) > new Date())
                );
                
                // দশমিক সহ নিখুঁত পার্সেন্টেজ হিসাব
                const discountPercent =
                  hasDiscount && product.price > 0
                    ? (((product.price - product.discount_price!) / product.price) * 100).toFixed(2)
                    : null;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-sm dark:shadow-lg hover:shadow-sky-500/5 cursor-pointer"
                  >
                    
                    {/* === স্লিম কার্ড ডিজাইন (আগের মতো) === */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      
                      {/* ছবি এবং ব্যাজের কন্টেইনার (w-16 h-16) */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shrink-0">
                        
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs">🎮</span>
                        )}

                        {/* ১. ডিসকাউন্ট ব্যাজ (ছবির ঠিক ওপরের বাঁ-দিকের কোনায় সেট করা) */}
                        {hasDiscount && (
                          <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg rounded-tl-xl shadow-sm z-10">
                            {discountPercent}% OFF
                          </div>
                        )}

                        {/* ২. ভিউ আইকন (ছবির ঠিক নিচের ডান-দিকের কোনায় সেট করা) */}
                        <div className="absolute bottom-0 right-0 bg-black/70 backdrop-blur-md text-[9px] text-slate-200 px-1.5 py-0.5 rounded-tl-lg rounded-br-xl font-mono flex items-center gap-1 z-10 border-t border-l border-white/10">
                          <span>👁️</span><span>{product.views || 0}</span>
                        </div>
                      </div>

                      {/* প্রোডাক্ট ডিটেইলস */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                          {product.category}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 sm:line-clamp-3 leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-300 transition">
                          {product.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] pt-1">
                          {isOfficial ? (
                            <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0 shadow-xs">
                                <svg
                                  className="w-2.5 h-2.5 text-white"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                              <span>Official Store</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (product.seller_id) {
                                  router.push(`/seller/${product.seller_id}`);
                                }
                              }}
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                              title="Click to visit Merchant Storefront"
                            >
                              <span>🏪</span> {product.seller_name || "Seller"}
                            </button>
                          )}

                          {product.delivery_type === "manual" ? (
                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                              <span>🕒</span> Manual Delivery
                            </span>
                          ) : (
                            <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                              <span>⚡</span> Auto Delivery
                            </span>
                          )}

                          {product.delivery_type !== "manual" && (
                            <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              Stock:{" "}
                              <strong className={stock > 0 ? "text-emerald-500 dark:text-emerald-400 font-bold" : "text-rose-500 dark:text-rose-400 font-bold"}>
                                {stock}
                              </strong>
                            </span>
                          )}

                          <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            Sold: <strong className="text-slate-800 dark:text-slate-200 font-bold">{product.sold_count || 0}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-none">Price</span>
                        {hasDiscount ? (
                          <div className="flex items-baseline gap-1.5 justify-end">
                            <span className="text-[11px] line-through text-slate-400 dark:text-slate-500">
                              ${product.price}
                            </span>
                            <span className="text-xs sm:text-base font-black text-emerald-500 dark:text-emerald-400 leading-tight">
                              ${product.discount_price}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-base font-black text-sky-500 dark:text-sky-400 leading-tight">
                            ${product.price}
                          </span>
                        )}
                      </div>
                      <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl transition whitespace-nowrap shadow-md shadow-sky-500/20">
                        Buy Now →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
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
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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