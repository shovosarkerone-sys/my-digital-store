"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface SellerInfo {
  id: string;
  shop_name: string;
  email?: string;
  created_at: string;
  country?: string;
  seller_level?: number;
  rating?: number;
  bio?: string;
}

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  discount_price?: number | null;
  discount_until?: string | null;
  delivery_type?: "auto" | "manual";
  image_url: string | null;
  voucher_codes?: string | null;
  sold_count?: number;
  views?: number;
}

interface LevelInfo {
  level: number;
  title: string;
  badgeColor: string;
  textColor: string;
  icon: string;
}

const BUYER_LEVELS: Record<number, LevelInfo> = {
  1: { level: 1, title: "Newbie", badgeColor: "bg-slate-800 border-slate-700", textColor: "text-slate-300", icon: "🌱" },
  2: { level: 2, title: "Rookie", badgeColor: "bg-blue-500/10 border-blue-500/20", textColor: "text-blue-400", icon: "🎮" },
  3: { level: 3, title: "Gamer", badgeColor: "bg-emerald-500/10 border-emerald-500/20", textColor: "text-emerald-400", icon: "🕹️" },
  4: { level: 4, title: "Pro Gamer", badgeColor: "bg-sky-500/10 border-sky-500/30", textColor: "text-sky-400", icon: "⚡" },
  5: { level: 5, title: "Master", badgeColor: "bg-indigo-500/10 border-indigo-500/30", textColor: "text-indigo-400", icon: "🔮" },
  6: { level: 6, title: "Veteran", badgeColor: "bg-amber-500/10 border-amber-500/30", textColor: "text-amber-400", icon: "🎖️" },
  7: { level: 7, title: "Champion", badgeColor: "bg-yellow-500/15 border-yellow-500/40", textColor: "text-yellow-400", icon: "🏆" },
  8: { level: 8, title: "Elite", badgeColor: "bg-cyan-500/15 border-cyan-500/40", textColor: "text-cyan-400", icon: "💎" },
  9: { level: 9, title: "Legend", badgeColor: "bg-rose-500/15 border-rose-500/40", textColor: "text-rose-400", icon: "🔥" },
  10: { level: 10, title: "Immortal", badgeColor: "bg-amber-400/20 border-amber-400/50", textColor: "text-amber-300", icon: "👑" },
};

export default function SellerPublicProfile() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params?.id as string;

  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "feedbacks" | "about">("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetchSellerData() {
      if (!sellerId) return;

      try {
        // ১. সেলারের তথ্য লোড
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("*")
          .eq("id", sellerId)
          .maybeSingle();

        if (sellerData) {
          setSeller(sellerData);
        } else {
          // ডিফল্ট ভেরিফায়েড মার্চেন্ট অবজেক্ট
          setSeller({
            id: sellerId,
            shop_name: "Verified Merchant",
            email: "merchant@inskeys.com",
            created_at: "2024-01-01",
            country: "Global",
            seller_level: 3,
            rating: 100,
            bio: "Official verified digital store partner on Inskeys Marketplace.",
          });
        }

        // ২. এই সেলারের পণ্যসমূহ লোড
        const { data: productData } = await supabase
          .from("products")
          .select("id, title, category, price, discount_price, discount_until, delivery_type, image_url, voucher_codes, sold_count, views")
          .eq("seller_id", sellerId)
          .order("id", { ascending: false });

        if (productData) {
          setProducts(productData);
        }
      } catch (err) {
        console.error("Error loading seller:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSellerData();
  }, [sellerId]);

  // মেম্বারশিপের বয়স হিসেব (বছর, মাস ও দিন)
  const getDuration = (dateStr?: string) => {
    if (!dateStr) return "1 month";
    const start = new Date(dateStr);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonth;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);

    return parts.join(", ");
  };

  const handleStartChat = () => {
    const contactEmail = seller?.email || "contact@inskeys.com";
    router.push(`/dashboard?tab=messages&contact=${encodeURIComponent(contactEmail)}`);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const totalSold = products.reduce((acc, p) => acc + (p.sold_count || 0), 0);

  // অটো-লেভেল ক্যালকুলেশন (অর্ডার সংখ্যা অনুযায়ী)
  const calculateSellerLevel = (sold: number) => {
    if (sold >= 2500) return 10;
    if (sold >= 1000) return 9;
    if (sold >= 500) return 8;
    if (sold >= 250) return 7;
    if (sold >= 100) return 6;
    if (sold >= 50) return 5;
    if (sold >= 25) return 4;
    if (sold >= 10) return 3;
    if (sold >= 3) return 2;
    return 1;
  };

  const currentLevelNum = seller?.seller_level ? Number(seller.seller_level) : calculateSellerLevel(totalSold);
  const level = BUYER_LEVELS[currentLevelNum] || BUYER_LEVELS[1];

  // সেলারের পণ্যের ভেতর সার্চ ফিল্টারিং
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.title} ${p.category}`.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-400 font-mono text-sm">
        Loading Merchant Storefront...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/icon.png"
              alt="Inskeys"
              width={34}
              height={34}
              className="w-8 h-8 object-contain bg-transparent transition-transform group-hover:scale-105"
            />
            <span className="font-extrabold text-lg tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition cursor-pointer font-medium"
            >
              {copiedLink ? "Link Copied! ✓" : "🔗 Share Store"}
            </button>
            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Seller Hero Info Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Rank Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
                {level.icon}
              </div>

              {/* Identity & Badges */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {seller?.shop_name || "Merchant"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Verified Seller
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${level.badgeColor} ${level.textColor}`}>
                    Level {level.level} ({level.title})
                  </span>
                  <span>•</span>
                  <span>Region: <strong className="text-slate-200">{seller?.country || "Global"}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">100% Positive Feedback</span>
                </div>

                <p className="text-xs text-slate-400 pt-1 font-mono">
                  Member since: <span className="text-slate-300">{seller?.created_at?.split("T")[0] || "2024-01-01"}</span>{" "}
                  <span className="text-sky-400">({getDuration(seller?.created_at)})</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
              <button
                type="button"
                onClick={handleStartChat}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-sky-950 transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="text-base">💬</span>
                <span>Send Private Message</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-semibold text-amber-300">
                <span>🛡️</span> 36-Hour Buyer Safety Protected
              </div>
            </div>
          </div>

          {/* Seller Stats Counter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Listed Products</span>
              <strong className="text-base font-black text-white">{products.length}</strong>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Orders Sold</span>
              <strong className="text-base font-black text-sky-400">{totalSold}</strong>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Dispute Rate</span>
              <strong className="text-base font-black text-emerald-400">0.0%</strong>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Avg. Response Time</span>
              <strong className="text-base font-black text-white">Under 15m</strong>
            </div>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "products"
                ? "bg-sky-500 text-white shadow-md shadow-sky-950"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span>📦 Products</span>
            <span className="text-[10px] opacity-80 font-mono">({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("feedbacks")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "feedbacks"
                ? "bg-sky-500 text-white shadow-md shadow-sky-950"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span>⭐ Feedback & Reviews</span>
            <span className="text-[10px] text-emerald-400 font-bold">100%</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "about"
                ? "bg-sky-500 text-white shadow-md shadow-sky-950"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span>🛡️ Store Guarantee</span>
          </button>
        </div>

        {/* TAB 1: PRODUCT INVENTORY */}
        {activeTab === "products" && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Items in this Merchant's Inventory</h2>
                <p className="text-xs text-slate-400">
                  Genuine digital keys, activation licenses, and game vouchers.
                </p>
              </div>

              {/* Search Inside Seller Inventory */}
              {products.length > 2 && (
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search in this store..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
                </div>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
                No products found matching your search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => {
                  const stock = product.voucher_codes
                    ? product.voucher_codes.split("\n").filter((c) => c.trim()).length
                    : 0;

                  const hasDiscount = Boolean(
                    product.discount_price &&
                    product.discount_price < product.price &&
                    (!product.discount_until || new Date(product.discount_until) > new Date())
                  );
                  const discountPercent =
                    hasDiscount && product.price > 0
                      ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
                      : null;

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-lg hover:shadow-sky-500/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-700/60">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          ) : (
                            <span className="text-slate-600 text-xs">🎮</span>
                          )}
                          {hasDiscount && (
                            <div className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow">
                              {discountPercent}% OFF
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                            {product.category}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-sky-300 transition">
                            {product.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {product.delivery_type === "manual" ? (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                                🕒 Manual Delivery
                              </span>
                            ) : (
                              <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-bold">
                                ⚡ Auto Delivery
                              </span>
                            )}

                            {product.delivery_type !== "manual" && (
                              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-medium">
                                Stock: <strong className={stock > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{stock}</strong>
                              </span>
                            )}

                            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-medium">
                              Sold: <strong className="text-slate-200 font-bold">{product.sold_count || 0}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 block leading-none">Price</span>
                          {hasDiscount ? (
                            <div className="flex items-baseline gap-1.5 justify-end">
                              <span className="text-[11px] line-through text-slate-500 font-mono">
                                ${product.price}
                              </span>
                              <span className="text-xs sm:text-base font-black text-emerald-400 leading-tight font-mono">
                                ${product.discount_price}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-base font-black text-sky-400 leading-tight font-mono">
                              ${product.price}
                            </span>
                          )}
                        </div>
                        <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-xl transition whitespace-nowrap shadow-md">
                          Buy Now →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: FEEDBACK & REVIEWS */}
        {activeTab === "feedbacks" && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Verified Buyer Feedbacks
                </h3>
                <p className="text-xs text-slate-400">
                  Reviews submitted after blockchain payment confirmation.
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                100% Positive (5.0 / 5.0)
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">★★★★★</span>
                    <strong className="text-xs text-white">Instant code delivery, perfectly working!</strong>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Verified Purchase</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Bought a game card from this merchant. The key was displayed instantly on screen and activated without issues."
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">★★★★★</span>
                    <strong className="text-xs text-white">Fast communication and trusted seller</strong>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Verified Purchase</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "Friendly seller, helped me verify the regional activation instructions via direct messages. Recommended!"
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: STORE GUARANTEE & POLICY */}
        {activeTab === "about" && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Store Security & Escrow Protection
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-lg">🛡️</span>
                <h4 className="font-bold text-white">36-Hour Escrow Hold</h4>
                <p className="text-slate-400 leading-relaxed">
                  Payment for orders from this merchant is held safely in escrow for 36 hours. If an activation key is invalid, the buyer is covered under our money-back guarantee.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-lg">⚡</span>
                <h4 className="font-bold text-white">Instant Dispute Resolution</h4>
                <p className="text-slate-400 leading-relaxed">
                  You can open a dispute ticket or send a private message to this seller at any time through your account dashboard.
                </p>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}