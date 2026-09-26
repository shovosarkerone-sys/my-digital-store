"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

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
  voucher_codes?: string | null;
  sold_count?: number;
}

interface Category {
  id: number;
  name: string;
  image_url?: string | null;
}

interface Seller {
  id: string;
  shop_name: string;
  country: string;
  description?: string | null;
  seller_level?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  document_front_url?: string | null;
  document_back_url?: string | null;
  verification_status: "pending" | "verified" | "rejected";
  created_at?: string;
}

interface SupportTicket {
  id: number;
  user_id?: string | null;
  user_name?: string | null;
  user_email: string;
  role?: string | null;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  admin_reply?: string | null;
  created_at: string;
}

interface BannedUser {
  user_id: string;
  user_email: string;
  locked_by: string;
}

export default function SecretAdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<
    "all_products" | "add_product" | "categories" | "merchants" | "tickets" | "users"
  >("all_products");
  
  const [productStep, setProductStep] = useState<1 | 2>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  
  // Product Form States
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountDurationType, setDiscountDurationType] = useState<"none" | "lifetime" | "custom">("none");
  const [discountDays, setDiscountDays] = useState("7");
  const [deliveryType, setDeliveryType] = useState<"auto" | "manual">("auto");
  const [description, setDescription] = useState("");
  const [voucherCodes, setVoucherCodes] = useState("");
  
  // Category Form States
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [existingCategoryImageUrl, setExistingCategoryImageUrl] = useState<string | null>(null);
  
  // Status message
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_authenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, []);

  const fetchAllData = () => {
    fetchCategories();
    fetchProducts();
    fetchSellers();
    fetchTickets();
    fetchBannedUsers();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "shovo2026";
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      setPasswordError("");
      fetchAllData();
    } else {
      setPasswordError("Access Denied: Invalid Administrative Passkey.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("id", { ascending: false });
    if (data) setProducts(data);
  };

  const fetchSellers = async () => {
    const { data } = await supabase.from("sellers").select("*").order("id", { ascending: false });
    if (data) setSellers(data);
  };

  const fetchTickets = async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("id", { ascending: false });
    if (data) setTickets(data);
  };

  const fetchBannedUsers = async () => {
    const { data } = await supabase.from("banned_users").select("*");
    if (data) setBannedUsers(data);
  };

  // Fixed TypeScript issue allowing string | null | undefined
  const handleToggleLock = async (userId: string | null | undefined, userEmail: string) => {
    if (!userId) return;
    const isBanned = bannedUsers.some(b => b.user_id === userId);
    try {
      if (isBanned) {
        await supabase.from("banned_users").delete().eq("user_id", userId);
        setMessage(`Account unlocked successfully: ${userEmail}`);
      } else {
        await supabase.from("banned_users").insert([{ user_id: userId, user_email: userEmail }]);
        setMessage(`Account locked successfully: ${userEmail}`);
      }
      fetchBannedUsers();
    } catch (err: any) {
      alert(`Lock toggle failed: ${err.message}`);
    }
  };

  const handleQuickStatusUpdate = async (ticketId: number, status: string) => {
    try {
      await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
      setMessage(`Ticket #${ticketId} status updated to ${status}`);
      fetchTickets();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const activeSelectedCategory = categories.find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );

  const handleUpdateSellerStatus = async (sellerId: string, status: "verified" | "rejected") => {
    try {
      const { error } = await supabase.from("sellers").update({ verification_status: status }).eq("id", sellerId);
      if (error) throw error;
      setMessage(`Merchant verification status updated to: ${status.toUpperCase()}`);
      await fetchSellers();
    } catch (err: any) {
      alert(`Error updating merchant: ${err.message}`);
    }
  };

  const handleProductStepOneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) { setMessage("Please select a valid product category."); return; }
    setSubmitting(true); setMessage("");
    try {
      const autoCategoryImageUrl = activeSelectedCategory?.image_url || null;
      let computedDiscountUntil: string | null = null;
      if (discountDurationType === "custom" && discountDays) {
        const d = new Date(); d.setDate(d.getDate() + parseInt(discountDays)); computedDiscountUntil = d.toISOString();
      } else if (discountDurationType === "lifetime") {
        computedDiscountUntil = "2099-12-31T23:59:59Z";
      }
      const payload = {
        title: title.trim(), category, price: parseFloat(price),
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        discount_until: computedDiscountUntil, image_url: autoCategoryImageUrl,
        description: description.trim(), seller_name: "Official Store",
      };
      if (editingProductId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProductId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products")
          .insert([{ ...payload, delivery_type: "auto", voucher_codes: "", views: 0, sold_count: 0 }])
          .select().single();
        if (error) throw error;
        if (data) setEditingProductId(data.id);
      }
      setProductStep(2);
    } catch (err: any) { setMessage(`Error: ${err.message}`); } finally { setSubmitting(false); }
  };

  const handleProductStepTwoSubmit = async () => {
    if (!editingProductId) return;
    setSubmitting(true); setMessage("");
    try {
      const payload = { delivery_type: deliveryType, voucher_codes: deliveryType === "auto" ? voucherCodes.trim() : null };
      const { error } = await supabase.from("products").update(payload).eq("id", editingProductId);
      if (error) throw error;
      setMessage("Product published & delivery setup completed successfully!");
      resetProductForm(); await fetchProducts(); setActiveTab("all_products");
    } catch (err: any) { setMessage(`Error: ${err.message}`); } finally { setSubmitting(false); }
  };

  const resetProductForm = () => {
    setEditingProductId(null); setTitle(""); setCategory(""); setPrice(""); setDiscountPrice("");
    setDiscountDurationType("none"); setDiscountDays("7"); setDeliveryType("auto"); setDescription(""); setVoucherCodes(""); setProductStep(1);
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id); setTitle(p.title); setCategory(p.category); setPrice(p.price.toString());
    setDiscountPrice(p.discount_price ? p.discount_price.toString() : "");
    if (p.discount_until) {
      if (p.discount_until.startsWith("2099")) {
        setDiscountDurationType("lifetime");
      } else {
        setDiscountDurationType("custom");
      }
    } else {
      setDiscountDurationType("none");
    }
    setDeliveryType(p.delivery_type || "auto"); setDescription(p.description); setVoucherCodes(p.voucher_codes || "");
    setProductStep(1); setActiveTab("add_product"); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to permanently remove this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) fetchProducts();
  };

  const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCategoryImageFile(file); setCategoryImagePreview(URL.createObjectURL(file)); }
  };

  const uploadImageToStorage = async (file: File, folder: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setSubmitting(true); setMessage("");
    try {
      let finalCatImageUrl = existingCategoryImageUrl;
      if (categoryImageFile) { finalCatImageUrl = await uploadImageToStorage(categoryImageFile, "categories"); }
      const payload = { name: categoryName.trim(), image_url: finalCatImageUrl };
      if (editingCategoryId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCategoryId);
        if (error) throw error;
        if (finalCatImageUrl) {
          await supabase.from("products").update({ image_url: finalCatImageUrl }).ilike("category", categoryName.trim());
        }
        setMessage("Category updated & synced to related products successfully.");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        setMessage("Category created successfully.");
      }
      resetCategoryForm(); await fetchCategories(); await fetchProducts();
    } catch (err: any) { setMessage(`Error: ${err.message}`); } finally { setSubmitting(false); }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null); setCategoryName(""); setCategoryImageFile(null); setCategoryImagePreview(null); setExistingCategoryImageUrl(null);
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id); setCategoryName(cat.name); setExistingCategoryImageUrl(cat.image_url || null);
    setCategoryImagePreview(cat.image_url || null); setCategoryImageFile(null); setActiveTab("categories"); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) fetchCategories();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 transition-colors duration-200">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl dark:shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 mx-auto flex items-center justify-center text-xl font-bold">🔒</div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Administrative Key</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter master key to access the control panel</p>
          </div>
          {passwordError && (<div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs rounded-xl text-center">{passwordError}</div>)}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Passkey</label>
              <input type="password" required autoFocus value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Enter access code..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-sky-500/20">Unlock Console →</button>
          </form>
          <div className="text-center">
            <Link href="/" className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400">← Return to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingSellersCount = sellers.filter((s) => s.verification_status === "pending").length;
  // Extract unique buyers from tickets
  const uniqueBuyers = Array.from(new Map(tickets.filter(t => t.role === 'buyer' && t.user_id).map(t => [t.user_id, t])).values());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link href="/" className="flex items-center gap-3 group transition hover:opacity-95">
          <div className="shrink-0"><Image src="/icon.png" alt="Inskeys" width={38} height={38} className="w-9 h-9 object-contain bg-transparent" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-sky-500 dark:group-hover:text-sky-400 transition">Inskeys Admin Console</h1>
            <span className="text-xs text-sky-600 dark:text-sky-400 font-mono">Control Center</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-400 transition">Home</Link>
          <button onClick={handleLogout} className="text-xs bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 dark:text-rose-400 px-3 py-2 rounded-xl transition cursor-pointer" title="Lock Portal">🔒 Lock</button>
        </div>
      </div>
      {message && (<div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold">{message}</div>)}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab("all_products")} className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${activeTab === "all_products" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>📦 All Products ({products.length})</button>
        <button onClick={() => { resetProductForm(); setActiveTab("add_product"); }} className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${activeTab === "add_product" ? "bg-sky-500 text-white font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>➕ Add New Product</button>
        <button onClick={() => setActiveTab("categories")} className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${activeTab === "categories" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>🏷️ Categories ({categories.length})</button>
        <button onClick={() => setActiveTab("merchants")} className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${activeTab === "merchants" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}><span>👥 KYC</span>{pendingSellersCount > 0 && (<span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">{pendingSellersCount}</span>)}</button>
        <button onClick={() => setActiveTab("users")} className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${activeTab === "users" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>👤 Users Directory</button>
        <button onClick={() => setActiveTab("tickets")} className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${activeTab === "tickets" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>🎫 Support Tickets ({tickets.length})</button>
      </div>

      {/* VIEW 1: USERS DIRECTORY (NEW) */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Registered Sellers */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              Registered Sellers ({sellers.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sellers.map((s) => {
                const isBanned = bannedUsers.some((b) => b.user_id === s.id);
                return (
                  <div key={s.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.shop_name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: {s.id}</p>
                    </div>
                    <button
                      onClick={() => handleToggleLock(s.id, s.shop_name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                        isBanned ? "bg-amber-500/20 text-amber-600 border border-amber-500/30 hover:bg-amber-500/30" : "bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20"
                      }`}
                    >
                      {isBanned ? "🔓 Unlock" : "🔒 Lock"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Buyers */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Active Buyers ({uniqueBuyers.length})
              </h2>
              <p className="text-[10px] text-slate-500">List of buyers extracted from support ticket records.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uniqueBuyers.map((b) => {
                if (!b.user_id) return null;
                const isBanned = bannedUsers.some((ban) => ban.user_id === b.user_id);
                return (
                  <div key={b.user_id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{b.user_name || "Unknown Buyer"}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{b.user_email}</p>
                    </div>
                    <button
                      onClick={() => handleToggleLock(b.user_id, b.user_email)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                        isBanned ? "bg-amber-500/20 text-amber-600 border border-amber-500/30 hover:bg-amber-500/30" : "bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20"
                      }`}
                    >
                      {isBanned ? "🔓 Unlock" : "🔒 Lock"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ALL PRODUCTS TAB */}
      {activeTab === "all_products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Inventory & Catalog ({products.length})</h2>
            <button onClick={() => { resetProductForm(); setActiveTab("add_product"); }} className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-lg transition">+ Add Product</button>
          </div>
          {products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm">No products listed yet. Click "Add New Product" to create your first listing.</div>
          ) : (
            <div className="space-y-2">
              {products.map((p) => {
                const stock = p.voucher_codes ? p.voucher_codes.split("\n").filter((c) => c.trim()).length : 0;
                const hasDiscount = p.discount_price && p.discount_price < p.price;
                const discountPercent = hasDiscount && p.price > 0 ? Math.round(((p.price - p.discount_price!) / p.price) * 100) : null;
                return (
                  <div key={p.id} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative">
                        {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-400 dark:text-slate-500">🎮</span>}
                        {hasDiscount && <span className="absolute top-1 left-1 bg-rose-500 text-white text-[9px] font-bold px-1 rounded">{discountPercent}% OFF</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</h4>
                          {p.delivery_type === "manual" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">🕒 Manual</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20">⚡ Auto</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.category} • {hasDiscount ? <><span className="line-through text-slate-400">${p.price}</span> <strong className="text-emerald-500">${p.discount_price}</strong></> : <strong>${p.price}</strong>}
                          {" "}• Stock: {p.delivery_type === "manual" ? <strong className="text-amber-500">Manual</strong> : <strong className={stock > 0 ? "text-emerald-500" : "text-rose-500"}>{stock} codes</strong>}
                          {" "}• Sold: {p.sold_count || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => startEditProduct(p)} className="text-xs text-sky-600 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition">Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-xs text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT PRODUCT TAB */}
      {activeTab === "add_product" && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{editingProductId ? "Edit Product" : "Add New Product"}</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">{productStep === 1 ? "Step 1 of 2: Product Information" : "Step 2 of 2: Delivery Method Setup"}</span>
            </div>
            {editingProductId && <button type="button" onClick={resetProductForm} className="text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">Cancel</button>}
          </div>
          {productStep === 1 && (
            <form onSubmit={handleProductStepOneSubmit} className="space-y-4">
              <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Title</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-sky-500" /></div>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category & Product Icon</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                    {activeSelectedCategory?.image_url ? <img src={activeSelectedCategory.image_url} alt="icon" className="w-full h-full object-cover" /> : <span className="text-xs">No Icon</span>}
                  </div>
                  <div className="flex-1 space-y-1">
                    <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none">
                      <option value="" disabled>-- Select a Category --</option>
                      {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold mb-1">Regular Price (USD $)</label><input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl px-4 py-2 text-xs" /></div>
                <div><label className="block text-xs font-semibold mb-1">Discount Price (Optional)</label><input type="number" step="0.01" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl px-4 py-2 text-xs" /></div>
              </div>
              {discountPrice && parseFloat(discountPrice) < parseFloat(price || "0") && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1">Offer Type</label>
                      <select value={discountDurationType} onChange={(e) => setDiscountDurationType(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                        <option value="none">No Expiry</option><option value="lifetime">Lifetime</option><option value="custom">Custom Days</option>
                      </select>
                    </div>
                    {discountDurationType === "custom" && (<div><label className="block text-xs mb-1">Days</label><input type="number" value={discountDays} onChange={(e) => setDiscountDays(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" /></div>)}
                  </div>
                </div>
              )}
              <div><label className="block text-xs font-semibold mb-1">Description</label><textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl p-3 text-xs" /></div>
              <div className="flex justify-end pt-2"><button type="submit" disabled={submitting} className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl">{submitting ? "Saving..." : "Next →"}</button></div>
            </form>
          )}
          {productStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div onClick={() => setDeliveryType("auto")} className={`p-5 rounded-2xl border cursor-pointer ${deliveryType === "auto" ? "bg-sky-500/10 border-sky-500" : "bg-slate-50 border-slate-200"}`}>
                  <h4 className="text-sm font-bold">⚡ Automatic Delivery</h4>
                </div>
                <div onClick={() => setDeliveryType("manual")} className={`p-5 rounded-2xl border cursor-pointer ${deliveryType === "manual" ? "bg-amber-500/10 border-amber-500" : "bg-slate-50 border-slate-200"}`}>
                  <h4 className="text-sm font-bold">🕒 Manual Delivery</h4>
                </div>
              </div>
              {deliveryType === "auto" ? (
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <textarea rows={4} value={voucherCodes} onChange={(e) => setVoucherCodes(e.target.value)} className="w-full font-mono bg-white border border-slate-200 rounded-xl p-3 text-xs" placeholder="Codes..." />
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 text-xs text-amber-700 rounded-xl">Manual Delivery selected.</div>
              )}
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setProductStep(1)} className="px-4 py-2 text-xs text-slate-500">← Back</button>
                <button type="button" disabled={submitting} onClick={handleProductStepTwoSubmit} className="px-6 py-2.5 bg-emerald-500 text-white font-bold text-xs rounded-xl">{submitting ? "Finalizing..." : "Publish ✓"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider">{editingCategoryId ? "Edit Category" : "Add New Category"}</h2>
              {editingCategoryId && <button onClick={resetCategoryForm} className="text-xs text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1">Cancel</button>}
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input type="text" required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs" placeholder="Category Name" />
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                  {categoryImagePreview ? <img src={categoryImagePreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-400">No Photo</span>}
                </div>
                <div className="flex-1 space-y-1">
                  <input type="file" id="admin-cat-img" accept="image/*" onChange={handleCategoryImageChange} className="hidden" />
                  <label htmlFor="admin-cat-img" className="inline-block px-3 py-1.5 bg-slate-100 text-xs font-semibold rounded-lg cursor-pointer border border-slate-300">Upload Image</label>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-sky-500 text-white font-bold text-xs rounded-xl">{submitting ? "Processing..." : "Save Category"}</button>
            </form>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" /> : <span className="text-xs">🎮</span>}
                  </div>
                  <div className="min-w-0"><h4 className="text-xs font-bold truncate">{cat.name}</h4></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEditCategory(cat)} className="text-xs text-sky-600 bg-sky-500/10 px-2.5 py-1 rounded-lg">Edit</button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-xs text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MERCHANTS TAB */}
      {activeTab === "merchants" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Merchant Applications ({sellers.length})</h2>
            <button onClick={fetchSellers} className="text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">Refresh</button>
          </div>
          {sellers.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold">{s.shop_name} <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{s.verification_status}</span></h3>
                  <p className="text-xs text-slate-500 mt-0.5">Country: {s.country} • ID: {s.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.verification_status !== "verified" && <button onClick={() => handleUpdateSellerStatus(s.id, "verified")} className="px-3.5 py-1.5 bg-emerald-500 text-white text-xs rounded-xl">Approve</button>}
                  {s.verification_status !== "rejected" && <button onClick={() => handleUpdateSellerStatus(s.id, "rejected")} className="px-3.5 py-1.5 bg-rose-500/10 text-rose-500 text-xs rounded-xl">Reject</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUPPORT TICKETS TAB WITH CHAT BUTTON */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Support Tickets ({tickets.length})</h2>
            <button onClick={fetchTickets} className="text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">Refresh</button>
          </div>
          {tickets.map((t) => {
            const isBanned = bannedUsers.some(b => b.user_id === t.user_id);
            return (
              <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">#{t.id} - {t.subject}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">From: <strong>{t.user_name || "User"}</strong> ({t.user_email})</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line">{t.message}</div>
                
                {/* QUICK ACTIONS & CHAT LINK */}
                <div className="flex flex-wrap items-center gap-3 mt-4 border-t border-slate-200 pt-3">
                  <select
                    value={t.status}
                    onChange={(e) => handleQuickStatusUpdate(t.id, e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="open">Status: Open</option>
                    <option value="in_progress">Status: In Progress</option>
                    <option value="resolved">Status: Resolved</option>
                  </select>

                  <Link href={`/ticket/${t.id}`} className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
                    <span>Open Chat Room</span><span>💬</span>
                  </Link>

                  {t.user_id && (
                    <button
                      onClick={() => handleToggleLock(t.user_id, t.user_email)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isBanned ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                      }`}
                    >
                      {isBanned ? "🔓 Unlock User" : "🔒 Lock User"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}