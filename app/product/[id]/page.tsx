"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

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

        // ২. সেলারের ইমেইল ফেচ
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

        // ৩. লগইন করা বায়ারের ইমেইল অটো-ফিল
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

  // হোয়াটসঅ্যাপ ইউআরএল (Updated Number)
  const whatsappMessage = encodeURIComponent(
    `Hello Inskeys, I would like to purchase: "${product.title}" (Price: $${finalPrice} USD). Is it available?`
  );
  const whatsappUrl = `https://wa.me/8801797362397?text=${whatsappMessage}`;

  // পেমেন্ট চেকআউট হ্যান্ডলার
  const handleProceedPayment = async () => {
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
      setPaymentError("Gateway connection failed. Please try again.");
    } finally {
      setProcessingPayment(false);
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

              {/* বায়ার সুরক্ষা নোটিশ */}
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
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  isAvailable
                    ? "bg-[#0052FF] hover:bg-[#0043D1] text-white shadow-blue-900/50 active:scale-98"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                }`}
              >
                {/* ⚡ ইমোজি রিমুভ করা হয়েছে */}
                <span>{isAvailable ? `Pay with Crypto ($${finalPrice})` : "Out of Stock"}</span>
              </button>

              {/* আপডেট করা WhatsApp বাটন */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 border border-[#25D366]/30 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-current"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                <span>Buy via WhatsApp (+880 1797-362397)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* প্রিমিয়াম ক্রিপ্টমুস পেমেন্ট গেটওয়ে মডাল */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden text-left">
            {/* ব্যাকগ্রাউন্ড গ্লো */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                {/* অরিজিনাল লোগো ট্রান্সপারেন্ট করা হয়েছে (সাদা বক্স সরানো হয়েছে) */}
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-full h-full text-[#0052FF]"
                  >
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Cryptomus Gateway</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Secured Blockchain Payment
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentError("");
                }}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* অ্যামাউন্ট ও আইটেম সামারি */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between relative z-10">
              <div className="min-w-0 pr-3 space-y-1">
                <span className="text-[11px] text-slate-400 block truncate">{product.title}</span>
                <span className="text-xs font-bold text-slate-200 block">Total Payable</span>
              </div>
              <span className="text-xl font-black text-blue-400 font-mono">${finalPrice} USD</span>
            </div>

            {/* ক্রিপ্টো ডেলিভারি ইমেইল ফিল্ড */}
            <div className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Delivery Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner font-mono"
                />
                <span className="block text-[10px] text-slate-500 mt-1.5">
                  Your activation key and receipt will be dispatched to this email.
                </span>
              </div>

              {/* সাপোর্টেড কারেন্সি ব্যাজ */}
              <div className="pt-1">
                <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
                  Accepted Networks
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400">
                  <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">USDT</span>
                  <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">BTC</span>
                  <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">ETH</span>
                  <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg">TRC20</span>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                  ⚠️ {paymentError}
                </div>
              )}

              {/* সাবমিট বাটন */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={handleProceedPayment}
                  className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 bg-[#0052FF] hover:bg-[#0043D1] disabled:opacity-50 text-white shadow-lg shadow-blue-900/50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Connecting to Blockchain...</span>
                    </>
                  ) : (
                    <span>Proceed to Cryptomus Invoice →</span>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-3 font-medium">
                  🔒 Cryptographic 256-bit automated transaction processing
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}