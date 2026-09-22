"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

interface PaymentMethod {
  id: string;
  name: string;
  badge: string;
  tag: string;
  color: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "crypto", name: "Crypto (USDT / BTC / LTC)", badge: "⚡", tag: "Automated Gateway", color: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  { id: "binance", name: "Binance Pay", badge: "🟡", tag: "Zero Fees / Instant", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  { id: "bkash", name: "bKash Personal / Merchant", badge: "🌸", tag: "Instant MFS", color: "border-pink-500/30 bg-pink-500/10 text-pink-300" },
  { id: "rocket", name: "Nagad / Rocket", badge: "🟣", tag: "Fast Checkout", color: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
  { id: "card", name: "Visa / Mastercard", badge: "💳", tag: "International", color: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  { id: "bank", name: "Bank Wire Transfer", badge: "🏦", tag: "Direct Deposit", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [product, setProduct] = useState<any>(null);
  const [sellerEmail, setSellerEmail] = useState<string>("contact@inskeys.com");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("crypto");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    async function loadProductAndSeller() {
      if (!productId) return;

      try {
        // ১. প্রোডাক্ট ডাটা লোড
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .maybeSingle();

        if (error || !data) {
          setLoading(false);
          return;
        }

        setProduct(data);

        // ভিউ কাউন্ট ১ বৃদ্ধি
        await supabase
          .from("products")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", data.id);

        // ২. সেলারের ইমেইল ফেচ (যাতে চ্যাটে সরাসরি লিঙ্ক করা যায়)
        if (data.seller_id) {
          const { data: sellerData } = await supabase
            .from("sellers")
            .select("email, shop_name")
            .eq("id", data.seller_id)
            .maybeSingle();

          if (sellerData?.email) {
            setSellerEmail(sellerData.email);
          }
        }

        // ৩. লগইন করা বায়ারের ইমেইল অটো-ফিল
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          setCurrentUserEmail(user.email);
          setBuyerEmail(user.email);
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProductAndSeller();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="w-28 h-8 bg-slate-800 rounded-lg"></div>
            <div className="w-24 h-8 bg-slate-800 rounded-xl"></div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="w-full aspect-square bg-slate-800/80 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="w-24 h-4 bg-slate-800 rounded"></div>
              <div className="w-3/4 h-8 bg-slate-800 rounded"></div>
              <div className="w-1/2 h-5 bg-slate-800 rounded"></div>
              <div className="w-full h-24 bg-slate-800/60 rounded-xl"></div>
              <div className="w-full h-12 bg-slate-800 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 space-y-4">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <Link href="/" className="text-xs text-sky-400 underline">
          ← Return to Storefront
        </Link>
      </div>
    );
  }

  // স্টক ক্যালকুলেশন
  const stockCount = product.voucher_codes
    ? product.voucher_codes
        .split("\n")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0).length
    : 0;

  const isManual = product.delivery_type === "manual";
  // ম্যানুয়াল ডেলিভারি হলে স্টক কোড লাগে না, তাই এটি সবসময় অ্যাভেইলেবল
  const isAvailable = isManual ? true : stockCount > 0;
  const isOfficial = !product.seller_id || product.seller_name === "Official Store";

  // ডিসকাউন্ট ক্যালকুলেশন
  const hasDiscount = Boolean(
    product.discount_price &&
    product.discount_price < product.price &&
    (!product.discount_until || new Date(product.discount_until) > new Date())
  );
  const finalPrice = hasDiscount ? product.discount_price : product.price;
  const discountPercent =
    hasDiscount && product.price > 0
      ? Math.round(((product.price - product.discount_price) / product.price) * 100)
      : null;

  // হোয়াটসঅ্যাপ ইউআরএল
  const whatsappMessage = encodeURIComponent(
    `Hello Inskeys, I would like to purchase: "${product.title}" (Price: $${finalPrice} USD via ${selectedMethod.toUpperCase()}). Is it available?`
  );
  const whatsappUrl = `https://wa.me/8801797302397?text=${whatsappMessage}`;

  // পেমেন্ট চেকআউট হ্যান্ডলার
  const handleProceedPayment = async () => {
    // ক্রিপ্টো বা বাইন্যান্স হলে অটোমেটিক Cryptomus গেটওয়েতে পাঠাবে
    if (selectedMethod === "crypto" || selectedMethod === "binance") {
      const emailToUse = buyerEmail.trim() || currentUserEmail;
      if (!emailToUse || !emailToUse.includes("@")) {
        setPaymentError("A valid email is required to deliver your activation key.");
        return;
      }

      setProcessingPayment(true);
      setPaymentError("");

      try {
        const res = await fetch("/api/checkout/cryptomus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, buyerEmail: emailToUse }),
        });

        const data = await res.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setPaymentError(data.error || "Failed to initialize payment gateway.");
        }
      } catch (err) {
        setPaymentError("Gateway connection failed. Please try again or use WhatsApp.");
      } finally {
        setProcessingPayment(false);
      }
    } else {
      // বিকাশ, নগদ বা ব্যাংক ট্রান্সফারের ক্ষেত্রে সরাসরি কনসিয়ার্জে কানেক্ট হবে
      window.open(whatsappUrl, "_blank");
      setIsPaymentModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* হেডার */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={32}
                height={32}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
          >
            ← Back to Products
          </Link>
        </div>

        {/* প্রোডাক্ট কার্ড */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* প্রোডাক্ট ইমেজ ও ভিউজ */}
          <div className="space-y-3 relative z-10">
            <div className="w-full aspect-square bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/70 relative flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 text-sm font-mono">🎮 No Image Available</span>
              )}

              {hasDiscount && (
                <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-lg">
                  {discountPercent}% OFF
                </div>
              )}

              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-[10px] text-slate-300 px-2 py-1 rounded-md font-mono flex items-center gap-1 border border-white/10">
                <span>👁️</span>
                <span>{product.views || 0} views</span>
              </div>
            </div>
          </div>

          {/* প্রোডাক্ট বিবরণ ও অ্যাকশন */}
          <div className="flex flex-col justify-between space-y-6 relative z-10">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">
                  {product.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {product.title}
                </h1>
              </div>

              {/* সেলার পরিচিতি ও ডেলিভারি ব্যাজ */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {isOfficial ? (
                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0 shadow-xs">
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
                  <Link
                    href={`/seller/${product.seller_id}`}
                    className="bg-slate-800 hover:bg-slate-700 hover:text-sky-400 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>🏪</span>
                    <span>{product.seller_name || "Merchant"}</span>
                    <span className="text-[10px] text-sky-400">View Shop →</span>
                  </Link>
                )}

                {/* সেলারের সাথে চ্যাট বাটন */}
                {!isOfficial && (
                  <Link
                    href={`/dashboard?tab=messages&contact=${encodeURIComponent(sellerEmail)}`}
                    className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 transition"
                  >
                    <span>💬</span>
                    <span>Chat with Seller</span>
                  </Link>
                )}

                {isManual ? (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                    <span>🕒</span> Manual Delivery
                  </span>
                ) : (
                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                    <span>⚡</span> Auto Delivery
                  </span>
                )}

                {!isManual && (
                  <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg font-medium text-slate-400">
                    Stock:{" "}
                    <strong className={stockCount > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {stockCount} available
                    </strong>
                  </span>
                )}

                <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg font-medium text-slate-400">
                  Sold: <strong className="text-white font-bold">{product.sold_count || 0}</strong>
                </span>
              </div>

              {/* প্রাইস বক্স */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold block">Total Price</span>
                  {hasDiscount && (
                    <span className="text-[11px] text-rose-400 font-bold">
                      🔥 Special Limited Offer
                    </span>
                  )}
                </div>

                <div className="text-right">
                  {hasDiscount ? (
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-sm line-through text-slate-500 font-mono">
                        ${product.price}
                      </span>
                      <span className="text-3xl font-black text-emerald-400 font-mono">
                        ${product.discount_price}{" "}
                        <span className="text-xs text-slate-500 font-sans">USD</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-black text-sky-400 font-mono">
                      ${product.price}{" "}
                      <span className="text-xs text-slate-500 font-sans">USD</span>
                    </span>
                  )}
                </div>
              </div>

              {/* ডেসক্রিপশন */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Product Description & Redemption
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  {product.description || "Digital voucher code with instant delivery upon blockchain confirmation."}
                </p>
              </div>

              {/* বায়ার সুরক্ষা নোটিশ */}
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                <span>🛡️</span>
                <span>
                  <strong>36-Hour Buyer Protection:</strong> Funds are held in escrow until product activation validity is confirmed.
                </span>
              </div>
            </div>

            {/* বাই বাটন */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={!isAvailable}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  isAvailable
                    ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-950 active:scale-98"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                }`}
              >
                <span>⚡</span>
                <span>{isAvailable ? `Buy Now ($${finalPrice}) →` : "Out of Stock"}</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl font-bold text-xs transition border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>💬</span>
                <span>Buy via WhatsApp (+880 1797-302397)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* প্রিমিয়াম পেমেন্ট গেটওয়ে মডাল */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white">Select Payment Gateway</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete your order securely with escrow protection
                </p>
              </div>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentError("");
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* অ্যামাউন্ট ও আইটেম সামারি */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <span className="text-[11px] text-slate-500 block truncate">{product.title}</span>
                <span className="text-xs font-bold text-slate-200">Total Payable</span>
              </div>
              <span className="text-xl font-black text-emerald-400 font-mono">${finalPrice} USD</span>
            </div>

            {/* গেটওয়ে সিলেক্ট বাটন তালিকা */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setSelectedMethod(pm.id)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    selectedMethod === pm.id
                      ? "border-sky-500 bg-sky-500/10 ring-1 ring-sky-500/50"
                      : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{pm.badge}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block leading-tight truncate">{pm.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{pm.tag}</span>
                    </div>
                  </div>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedMethod === pm.id ? "border-sky-500 bg-sky-500" : "border-slate-700"
                    }`}
                  >
                    {selectedMethod === pm.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </button>
              ))}
            </div>

            {/* ক্রিপ্টো বা বাইন্যান্সের জন্য ডেলিভারি ইমেইল ফিল্ড */}
            {(selectedMethod === "crypto" || selectedMethod === "binance") && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Recipient Email (For instant key fulfillment)
                </label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            )}

            {paymentError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                ⚠️ {paymentError}
              </div>
            )}

            {/* সাবমিট বাটন */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={processingPayment}
                onClick={handleProceedPayment}
                className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white shadow-sky-950 cursor-pointer flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <span>Generating Secure Invoice...</span>
                ) : selectedMethod === "crypto" || selectedMethod === "binance" ? (
                  <span>Proceed to Cryptomus Gateway →</span>
                ) : (
                  <span>Continue with WhatsApp Verification →</span>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-500">
                🔒 Cryptographic 256-bit automated transaction processing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}