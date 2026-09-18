"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SellerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"products" | "add_product" | "finances">("products");

  // প্রোডাক্ট ও ক্যাটাগরি স্টেট
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // নতুন প্রোডাক্ট অ্যাড করার ফর্ম স্টেট
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [voucherCodes, setVoucherCodes] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    async function initDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/seller-dashboard");
        return;
      }
      setUser(user);

      // সেলার তথ্য আনা
      const { data: sellerData } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!sellerData) {
        router.push("/become-seller");
        return;
      }
      setSeller(sellerData);

      // ক্যাটাগরি তালিকা আনা
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (catData && catData.length > 0) {
        setCategories(catData);
        setCategory(catData[0].name);
      }

      // এই সেলারের নিজস্ব প্রোডাক্ট আনা
      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", user.id)
        .order("id", { ascending: false });

      if (prodData) {
        setMyProducts(prodData);
      }

      setLoading(false);
    }

    initDashboard();
  }, [router]);

  // নতুন প্রোডাক্ট সাবমিট হ্যান্ডলার
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduct(true);
    setActionMsg("");

    try {
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            title: title.trim(),
            category: category,
            price: parseFloat(price),
            image_url: imageUrl.trim() || null,
            description: description.trim(),
            seller_id: user.id,
            seller_name: seller.shop_name,
            voucher_codes: voucherCodes.trim(),
            views: 0,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setMyProducts([data[0], ...myProducts]);
      }

      setActionMsg("✅ Product successfully published to marketplace!");
      setTitle("");
      setPrice("");
      setImageUrl("");
      setDescription("");
      setVoucherCodes("");
      setActiveTab("products");
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // প্রোডাক্ট ডিলিট হ্যান্ডলার
  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to remove this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setMyProducts(myProducts.filter((p) => p.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-400 font-mono text-sm">
        Loading Seller Hub...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* টপ বার */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-sky-500/20">
              S
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Shovo<span className="text-sky-400">Store</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              Buyer Dashboard
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              Storefront
            </Link>
          </div>
        </div>

        {/* সেলার শপ প্রোফাইল ব্যানার */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-amber-500/20">
              🏬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{seller.shop_name}</h1>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                  {seller.seller_level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Location: <span className="text-slate-300 font-semibold">{seller.country}</span> | Total Listed: <span className="text-sky-400 font-bold">{myProducts.length} items</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("add_product")}
            className="w-full sm:w-auto text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-sky-950 flex items-center justify-center gap-1.5"
          >
            <span>➕</span>
            <span>Add New Product</span>
          </button>
        </div>

        {/* ট্যাব নেভিগেশন */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "products"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📦 My Products ({myProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("add_product")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "add_product"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ➕ List Product
          </button>
          <button
            onClick={() => setActiveTab("finances")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "finances"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            💰 Escrow & Earnings
          </button>
        </div>

        {actionMsg && (
          <div className="p-3 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white">
            {actionMsg}
          </div>
        )}

        {/* ট্যাব ১: মাই প্রোডাক্টস লিস্ট */}
        {activeTab === "products" && (
          <div className="space-y-4">
            {myProducts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <span className="text-3xl">📦</span>
                <h3 className="text-sm font-bold text-white">No products listed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the "Add New Product" button above to publish your first voucher code or digital license.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-700">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-600">No Img</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                          {p.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{p.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Price: <strong className="text-white">${p.price}</strong></span>
                          <span>•</span>
                          <span>Views: {p.views || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/product/${p.id}`}
                        className="text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl transition"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ট্যাব ২: প্রোডাক্ট অ্যাড ফর্ম */}
        {activeTab === "add_product" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-black text-white">Publish New Digital Listing</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your listing will automatically show on the homepage and search results.
              </p>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Steam $10 USD Global Gift Card Code"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} className="bg-slate-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Price (USD $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="9.99"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/voucher-image.png"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Redemption instructions, region limitations, activation steps..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Secret Voucher / License Codes (One per line)
                </label>
                <textarea
                  rows={3}
                  required
                  value={voucherCodes}
                  onChange={(e) => setVoucherCodes(e.target.value)}
                  placeholder="XXXXX-YYYYY-ZZZZZ (Buyers will automatically receive one code upon verified payment)"
                  className="w-full font-mono bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submittingProduct}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-sky-950 cursor-pointer"
              >
                {submittingProduct ? "Publishing Listing..." : "Publish Product Listing →"}
              </button>
            </form>
          </div>
        )}

        {/* ট্যাব ৩: ফাইন্যান্স ও এসক্রো সামারি */}
        {activeTab === "finances" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Available for Payout
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  ${seller.balance || "0.00"}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Escrow Hold (24–36h)
                </span>
                <span className="text-2xl font-black text-amber-400">
                  ${seller.hold_balance || "0.00"}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Completed Sales
                </span>
                <span className="text-2xl font-black text-sky-400">
                  {seller.total_sales || 0} Orders
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 space-y-2">
              <h3 className="font-bold text-white text-sm">Escrow Protection & Withdrawal Rules</h3>
              <p>
                • Funds from completed orders remain in <strong>Hold Balance</strong> for 24 to 36 hours to safeguard buyer authenticity.
              </p>
              <p>
                • When positive buyer feedback is received or the dispute window closes, funds automatically move to your <strong>Available Balance</strong>.
              </p>
              <p>
                • Crypto withdrawals (USDT, LTC, BTC) incur a small platform network fee deducted upon transfer request.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}