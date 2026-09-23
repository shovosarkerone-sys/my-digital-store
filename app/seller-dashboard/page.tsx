"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface LevelInfo {
  level: number;
  title: string;
  badgeColor: string;
  textColor: string;
  icon: string;
}

const SELLER_LEVELS: Record<number, LevelInfo> = {
  1: { level: 1, title: "Newbie", badgeColor: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700", textColor: "text-slate-700 dark:text-slate-300", icon: "🌱" },
  2: { level: 2, title: "Rookie", badgeColor: "bg-blue-500/10 border-blue-500/20", textColor: "text-blue-600 dark:text-blue-400", icon: "🎮" },
  3: { level: 3, title: "Gamer", badgeColor: "bg-emerald-500/10 border-emerald-500/20", textColor: "text-emerald-600 dark:text-emerald-400", icon: "🕹️" },
  4: { level: 4, title: "Pro Gamer", badgeColor: "bg-sky-500/10 border-sky-500/30", textColor: "text-sky-600 dark:text-sky-400", icon: "⚡" },
  5: { level: 5, title: "Master", badgeColor: "bg-indigo-500/10 border-indigo-500/30", textColor: "text-indigo-600 dark:text-indigo-400", icon: "🔮" },
  6: { level: 6, title: "Veteran", badgeColor: "bg-amber-500/10 border-amber-500/30", textColor: "text-amber-600 dark:text-amber-400", icon: "🎖️" },
  7: { level: 7, title: "Champion", badgeColor: "bg-yellow-500/15 border-yellow-500/40", textColor: "text-yellow-600 dark:text-yellow-400", icon: "🏆" },
  8: { level: 8, title: "Elite", badgeColor: "bg-cyan-500/15 border-cyan-500/40", textColor: "text-cyan-600 dark:text-cyan-400", icon: "💎" },
  9: { level: 9, title: "Legend", badgeColor: "bg-rose-500/15 border-rose-500/40", textColor: "text-rose-600 dark:text-rose-400", icon: "🔥" },
  10: { level: 10, title: "Immortal", badgeColor: "bg-amber-400/20 border-amber-400/50", textColor: "text-amber-600 dark:text-amber-300", icon: "👑" },
};

interface Category {
  id: number;
  name: string;
  image_url?: string | null;
}

export default function SellerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"products" | "add_product" | "finances" | "tickets">("products");

  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellerTickets, setSellerTickets] = useState<any[]>([]);

  // 2-Step Product Creation States
  const [productStep, setProductStep] = useState<1 | 2>(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountDurationType, setDiscountDurationType] = useState<"none" | "lifetime" | "custom">("none");
  const [discountDays, setDiscountDays] = useState("7");
  const [deliveryType, setDeliveryType] = useState<"auto" | "manual">("auto");
  const [description, setDescription] = useState("");
  const [voucherCodes, setVoucherCodes] = useState("");

  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  // Support Ticket Form States
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketActionMsg, setTicketActionMsg] = useState("");

  useEffect(() => {
    async function initDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth?redirect=/seller-dashboard");
        return;
      }
      setUser(user);

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

      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (catData && catData.length > 0) {
        setCategories(catData);
        setCategory(catData[0].name);
      }

      await loadSellerProducts(user.id);
      await loadSellerTickets(user.id);
      setLoading(false);
    }

    initDashboard();
  }, [router]);

  const loadSellerProducts = async (userId: string) => {
    const { data: prodData } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", userId)
      .order("id", { ascending: false });

    if (prodData) {
      setMyProducts(prodData);
    }
  };

  const loadSellerTickets = async (userId: string) => {
    const { data: tickets } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (tickets) {
      setSellerTickets(tickets);
    }
  };

  const activeSelectedCategory = categories.find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );

  const startEditProduct = (p: any) => {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setPrice(p.price.toString());
    setDiscountPrice(p.discount_price ? p.discount_price.toString() : "");
    setDeliveryType(p.delivery_type || "auto");
    setDescription(p.description || "");
    setVoucherCodes(p.voucher_codes || "");
    setProductStep(1);
    setActiveTab("add_product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setPrice("");
    setDiscountPrice("");
    setDiscountDurationType("none");
    setDiscountDays("7");
    setDeliveryType("auto");
    setDescription("");
    setVoucherCodes("");
    setProductStep(1);
    setActiveTab("products");
  };

  // STEP 1 SUBMISSION
  const handleProductStepOne = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      alert("Please select a category.");
      return;
    }
    setProductStep(2);
  };

  // STEP 2 SUBMISSION
  const handleProductFinalSubmit = async () => {
    setSubmittingProduct(true);
    setActionMsg("");

    try {
      const autoCategoryImageUrl = activeSelectedCategory?.image_url || null;

      let computedDiscountUntil: string | null = null;
      if (discountDurationType === "custom" && discountDays) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(discountDays));
        computedDiscountUntil = d.toISOString();
      } else if (discountDurationType === "lifetime") {
        computedDiscountUntil = "2099-12-31T23:59:59Z";
      }

      const payload = {
        title: title.trim(),
        category,
        price: parseFloat(price),
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        discount_until: computedDiscountUntil,
        image_url: autoCategoryImageUrl,
        description: description.trim(),
        seller_id: user.id,
        seller_name: seller.shop_name,
        delivery_type: deliveryType,
        voucher_codes: deliveryType === "auto" ? voucherCodes.trim() : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId)
          .eq("seller_id", user.id);

        if (error) throw error;
        setActionMsg("✅ Product & Stock updated successfully!");
      } else {
        const { error } = await supabase
          .from("products")
          .insert([{ ...payload, views: 0, sold_count: 0 }]);

        if (error) throw error;
        setActionMsg("✅ Product published successfully!");
      }

      cancelEdit();
      await loadSellerProducts(user.id);
    } catch (err: any) {
      setActionMsg(`❌ Error: ${err.message}`);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("seller_id", user.id);

    if (!error) {
      setMyProducts(myProducts.filter((p) => p.id !== id));
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTicket(true);
    setTicketActionMsg("");

    try {
      const { error } = await supabase.from("support_tickets").insert([
        {
          user_id: user.id,
          user_email: user.email,
          user_name: seller.shop_name,
          role: "seller",
          subject: newTicketSubject.trim(),
          message: newTicketMessage.trim(),
          status: "open",
        },
      ]);

      if (error) throw error;

      setTicketActionMsg("✅ Ticket submitted successfully! Support staff will reply here.");
      setNewTicketSubject("");
      setNewTicketMessage("");
      await loadSellerTickets(user.id);
    } catch (err: any) {
      setTicketActionMsg(`❌ Error: ${err.message}`);
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-sans text-sm transition-colors duration-200">
        Loading Merchant Hub...
      </div>
    );
  }

  // স্বয়ংক্রিয় সেলার লেভেল ক্যালকুলেশন
  const calculateSellerLevel = (sales: number) => {
    if (sales >= 2500) return 10;
    if (sales >= 1000) return 9;
    if (sales >= 500) return 8;
    if (sales >= 250) return 7;
    if (sales >= 100) return 6;
    if (sales >= 50) return 5;
    if (sales >= 25) return 4;
    if (sales >= 10) return 3;
    if (sales >= 3) return 2;
    return 1;
  };

  const currentLevelNumber = seller.seller_level
    ? Number(seller.seller_level)
    : calculateSellerLevel(seller.total_sales || 0);

  const levelDetails = SELLER_LEVELS[currentLevelNumber] || SELLER_LEVELS[1];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={32}
                height={32}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              Inskeys
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/seller/${user.id}`}
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-white bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl transition font-bold"
            >
              🏪 View Public Shop
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              Buyer Panel
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              Storefront
            </Link>
          </div>
        </div>

        {/* Merchant Hero Overview Card */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {levelDetails.icon}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">{seller.shop_name}</h1>
                <div className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${levelDetails.badgeColor} ${levelDetails.textColor}`}>
                  <span>Level {levelDetails.level}</span>
                  <span className="text-[10px] opacity-75 font-normal">({levelDetails.title})</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Region: <span className="text-slate-700 dark:text-slate-200">{seller.country}</span> | Active Listings:{" "}
                <span className="text-sky-600 dark:text-sky-400 font-semibold">{myProducts.length}</span> | Completed Orders:{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{seller.total_sales || 0}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              cancelEdit();
              setActiveTab("add_product");
            }}
            className="w-full sm:w-auto text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-sky-500/20"
          >
            + Create New Listing
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              activeTab === "products"
                ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            My Listings ({myProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("add_product")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              activeTab === "add_product"
                ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {editingId ? "Edit Listing & Stock" : "Add Product (2-Step)"}
          </button>
          <button
            onClick={() => setActiveTab("finances")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              activeTab === "finances"
                ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Escrow & Earnings
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              activeTab === "tickets"
                ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Support Tickets ({sellerTickets.length})
          </button>
        </div>

        {actionMsg && (
          <div className="p-3.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs">
            {actionMsg}
          </div>
        )}

        {/* TAB 1: MY PRODUCTS LISTINGS */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {myProducts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2 shadow-xs">
                <span className="text-3xl block">📦</span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No products listed yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "Create New Listing" to upload your first digital voucher or license code.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myProducts.map((p) => {
                  const stock = p.voucher_codes
                    ? p.voucher_codes.split("\n").filter((c: string) => c.trim()).length
                    : 0;

                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">🎮</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                            {p.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 truncate">
                            {p.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            <span>Price: <strong className="text-slate-900 dark:text-white">${p.price}</strong></span>
                            <span>•</span>
                            <span>
                              {p.delivery_type === "manual" ? (
                                <strong className="text-amber-600 dark:text-amber-400">🕒 Manual Delivery</strong>
                              ) : (
                                <span>
                                  Stock:{" "}
                                  <strong className={stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                    {stock} codes
                                  </strong>
                                </span>
                              )}
                            </span>
                            <span>•</span>
                            <span>Sold: {p.sold_count || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => startEditProduct(p)}
                          className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer font-semibold"
                        >
                          Edit / Stock
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 2-STEP PRODUCT PUBLISHING */}
        {activeTab === "add_product" && (
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-sm dark:shadow-2xl transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingId ? "Edit Product Listing & Stock" : "Publish New Product Listing"}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {productStep === 1 ? "Step 1 of 2: Product Information" : "Step 2 of 2: Delivery Method Setup"}
                </span>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* STEP 1: Basic Information */}
            {productStep === 1 && (
              <form onSubmit={handleProductStepOne} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Product Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. PUBG Mobile 60 UC Global Pin"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>

                {/* Category with Automatic Category Icon Preview */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category & Product Icon
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center">
                      {activeSelectedCategory?.image_url ? (
                        <img
                          src={activeSelectedCategory.image_url}
                          alt={activeSelectedCategory.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs font-mono">No Icon</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer shadow-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500">
                        Product image will automatically inherit the official icon of the selected category.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Regular Price (USD $)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="9.99"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Discount Price (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="7.99"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                    />
                  </div>
                </div>

                {/* Discount Duration Controls */}
                {discountPrice && parseFloat(discountPrice) < parseFloat(price || "0") && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <span className="block text-xs font-bold text-sky-600 dark:text-sky-400">Discount Timer / Duration</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Offer Type</label>
                        <select
                          value={discountDurationType}
                          onChange={(e) => setDiscountDurationType(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white shadow-xs"
                        >
                          <option value="none">No Expiry Date (Until manually changed)</option>
                          <option value="lifetime">Lifetime Deal</option>
                          <option value="custom">Set Specific Days</option>
                        </select>
                      </div>
                      {discountDurationType === "custom" && (
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Number of Days Active</label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={discountDays}
                            onChange={(e) => setDiscountDays(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Product Description</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Redemption instructions, region limitations, activation steps..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md shadow-sky-500/20 flex items-center gap-2"
                  >
                    <span>Next: Set Delivery Method →</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Choose Delivery Method */}
            {productStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">How will this product be delivered?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select fulfillment method for <strong>{title}</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Automatic Delivery */}
                  <div
                    onClick={() => setDeliveryType("auto")}
                    className={`p-5 rounded-2xl border cursor-pointer transition space-y-2 ${
                      deliveryType === "auto"
                        ? "bg-sky-500/10 border-sky-500 ring-1 ring-sky-500/50"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">⚡</span>
                      <input
                        type="radio"
                        checked={deliveryType === "auto"}
                        onChange={() => setDeliveryType("auto")}
                        className="cursor-pointer text-sky-500"
                      />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Automatic Delivery</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      License keys/vouchers are delivered instantly to buyer's screen right after payment confirmation.
                    </p>
                  </div>

                  {/* Manual Delivery */}
                  <div
                    onClick={() => setDeliveryType("manual")}
                    className={`p-5 rounded-2xl border cursor-pointer transition space-y-2 ${
                      deliveryType === "manual"
                        ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🕒</span>
                      <input
                        type="radio"
                        checked={deliveryType === "manual"}
                        onChange={() => setDeliveryType("manual")}
                        className="cursor-pointer text-amber-500"
                      />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Manual Delivery</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      You fulfill the order manually. A <strong>🕒 Manual Delivery</strong> badge will appear on storefront.
                    </p>
                  </div>
                </div>

                {deliveryType === "auto" ? (
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Voucher / License Codes (One code per line)
                      </label>
                      <span className="text-xs font-mono text-sky-600 dark:text-sky-400">
                        Stock: {voucherCodes.split("\n").filter((c: string) => c.trim()).length} codes
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={voucherCodes}
                      onChange={(e) => setVoucherCodes(e.target.value)}
                      placeholder="CODE-XXXXX-1111&#10;CODE-YYYYY-2222"
                      className="w-full font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                    🕒 Manual Delivery selected. No codes are required in advance. Orders will be marked for manual dispatch.
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setProductStep(1)}
                    className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    ← Back to Details
                  </button>
                  <button
                    type="button"
                    disabled={submittingProduct}
                    onClick={handleProductFinalSubmit}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md shadow-emerald-500/20"
                  >
                    {submittingProduct ? "Finalizing..." : "Complete & Publish Product ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ESCROW & EARNINGS */}
        {activeTab === "finances" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                  Available for Withdrawal
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ${seller.balance || "0.00"} USD
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                  Escrow Hold Balance (24–36h)
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  ${seller.hold_balance || "0.00"} USD
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                  Completed Orders
                </span>
                <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                  {seller.total_sales || 0}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">36-Hour Buyer Protection & Payout Policy</h3>
              <p>• Completed order funds remain in <strong>Hold Balance</strong> for 24 to 36 hours to safeguard buyer activation validity.</p>
              <p>• After the dispute clearance period, funds automatically transfer to your <strong>Available Balance</strong>.</p>
              <p>• Payout requests are executed via USDT (TRC-20 / BEP-20) or Binance Pay directly to your wallet.</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("tickets");
                    setNewTicketSubject("Payout Withdrawal Request");
                    setNewTicketMessage(`Hello Support, I would like to request a withdrawal of my available balance: $${seller.balance || "0.00"} USD to my USDT address: `);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  Request Payout Withdrawal →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUPPORT TICKETS */}
        {activeTab === "tickets" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm transition-colors">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Support Ticket</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Need help with orders or store payouts? Submit here.</p>
              </div>

              {ticketActionMsg && (
                <div className="p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  {ticketActionMsg}
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    placeholder="e.g. Escrow payout query"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Details</label>
                  <textarea
                    rows={4}
                    required
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-sky-500/20"
                >
                  {submittingTicket ? "Submitting Ticket..." : "Submit Ticket"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white px-1">Your Submitted Tickets</h3>
              {sellerTickets.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-2 shadow-sm transition-colors">
                  <span className="text-3xl block">🎫</span>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">No support tickets found</h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                    Any queries you submit will appear here and will be resolved by the support team.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sellerTickets.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{t.subject}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          t.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : t.status === "in_progress"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                        {t.message}
                      </p>
                      {t.admin_reply && (
                        <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-800 dark:text-sky-200 space-y-1">
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block">Support Staff Reply:</span>
                          <p>{t.admin_reply}</p>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        Ticket ID: #{t.id} • {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}