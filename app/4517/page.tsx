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

export default function SecretAdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<
    "all_products" | "add_product" | "categories" | "merchants" | "tickets"
  >("all_products");
  
  const [productStep, setProductStep] = useState<1 | 2>(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
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
      fetchCategories();
      fetchProducts();
      fetchSellers();
      fetchTickets();
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "shovo2026";
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      setPasswordError("");
      fetchCategories();
      fetchProducts();
      fetchSellers();
      fetchTickets();
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

  const activeSelectedCategory = categories.find(
    (c) => c.name.toLowerCase() === category.toLowerCase()
  );

  const handleUpdateSellerStatus = async (sellerId: string, status: "verified" | "rejected") => {
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ verification_status: status })
        .eq("id", sellerId);
      if (error) throw error;
      setMessage(`Merchant verification status updated to: ${status.toUpperCase()}`);
      await fetchSellers();
    } catch (err: any) {
      alert(`Error updating merchant: ${err.message}`);
    }
  };

  const handleProductStepOneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setMessage("Please select a valid product category.");
      return;
    }
    setSubmitting(true);
    setMessage("");
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
        seller_name: "Official Store",
      };
      if (editingProductId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProductId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([{ ...payload, delivery_type: "auto", voucher_codes: "", views: 0, sold_count: 0 }])
          .select()
          .single();
        if (error) throw error;
        if (data) setEditingProductId(data.id);
      }
      setProductStep(2);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductStepTwoSubmit = async () => {
    if (!editingProductId) return;
    setSubmitting(true);
    setMessage("");
    try {
      const payload = {
        delivery_type: deliveryType,
        voucher_codes: deliveryType === "auto" ? voucherCodes.trim() : null,
      };
      const { error } = await supabase.from("products").update(payload).eq("id", editingProductId);
      if (error) throw error;
      setMessage("Product published & delivery setup completed successfully!");
      resetProductForm();
      await fetchProducts();
      setActiveTab("all_products");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setTitle("");
    setCategory("");
    setPrice("");
    setDiscountPrice("");
    setDiscountDurationType("none");
    setDiscountDays("7");
    setDeliveryType("auto");
    setDescription("");
    setVoucherCodes("");
    setProductStep(1);
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setPrice(p.price.toString());
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
    setDeliveryType(p.delivery_type || "auto");
    setDescription(p.description);
    setVoucherCodes(p.voucher_codes || "");
    setProductStep(1);
    setActiveTab("add_product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to permanently remove this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) fetchProducts();
  };

  const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCategoryImageFile(file);
      setCategoryImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToStorage = async (file: File, folder: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setSubmitting(true);
    setMessage("");
    try {
      let finalCatImageUrl = existingCategoryImageUrl;
      if (categoryImageFile) {
        finalCatImageUrl = await uploadImageToStorage(categoryImageFile, "categories");
      }
      const payload = {
        name: categoryName.trim(),
        image_url: finalCatImageUrl,
      };
      if (editingCategoryId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCategoryId);
        if (error) throw error;
        if (finalCatImageUrl) {
          await supabase
            .from("products")
            .update({ image_url: finalCatImageUrl })
            .ilike("category", categoryName.trim());
        }
        setMessage("Category updated & synced to related products successfully.");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        setMessage("Category created successfully.");
      }
      resetCategoryForm();
      await fetchCategories();
      await fetchProducts();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryImageFile(null);
    setCategoryImagePreview(null);
    setExistingCategoryImageUrl(null);
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setExistingCategoryImageUrl(cat.image_url || null);
    setCategoryImagePreview(cat.image_url || null);
    setCategoryImageFile(null);
    setActiveTab("categories");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 mx-auto flex items-center justify-center text-xl font-bold">
              🔒
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Administrative Key</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter master key to access the control panel
            </p>
          </div>
          {passwordError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs rounded-xl text-center">
              {passwordError}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Passkey
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter access code..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-sky-500/20"
            >
              Unlock Console →
            </button>
          </form>
          <div className="text-center">
            <Link href="/" className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400">
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingSellersCount = sellers.filter((s) => s.verification_status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          href="/"
          className="flex items-center gap-3 group transition hover:opacity-95"
        >
          <div className="shrink-0">
            <Image
              src="/icon.png"
              alt="Inskeys"
              width={38}
              height={38}
              className="w-9 h-9 object-contain bg-transparent"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-sky-500 dark:group-hover:text-sky-400 transition">
              Inskeys Admin Console
            </h1>
            <span className="text-xs text-sky-600 dark:text-sky-400 font-mono">Control Center</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl hover:text-slate-900 dark:hover:text-white text-slate-600 dark:text-slate-400 transition"
          >
            Home
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 dark:text-rose-400 px-3 py-2 rounded-xl transition cursor-pointer"
            title="Lock Portal"
          >
            🔒 Lock
          </button>
        </div>
      </div>
      {message && (
        <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-amber-600 dark:text-amber-300">
          {message}
        </div>
      )}
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("all_products")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "all_products"
              ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          📦 All Products ({products.length})
        </button>
        <button
          onClick={() => {
            resetProductForm();
            setActiveTab("add_product");
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "add_product"
              ? "bg-sky-500 text-white font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          ➕ Add New Product
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "categories"
              ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          🏷️ Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("merchants")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "merchants"
              ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>👥 Merchants / KYC</span>
          {pendingSellersCount > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {pendingSellersCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "tickets"
              ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-300 dark:border-slate-700"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          🎫 Support Tickets ({tickets.length})
        </button>
      </div>

      {/* TAB 1: ALL PRODUCTS */}
      {activeTab === "all_products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Inventory & Catalog ({products.length})
            </h2>
            <button
              onClick={() => {
                resetProductForm();
                setActiveTab("add_product");
              }}
              className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-lg transition"
            >
              + Add Product
            </button>
          </div>
          {products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm">
              No products listed yet. Click "Add New Product" to create your first listing.
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((p) => {
                const stock = p.voucher_codes
                  ? p.voucher_codes.split("\n").filter((c) => c.trim()).length
                  : 0;
                const hasDiscount = p.discount_price && p.discount_price < p.price;
                const discountPercent = hasDiscount && p.price > 0
                  ? Math.round(((p.price - p.discount_price!) / p.price) * 100)
                  : null;
                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">🎮</span>
                        )}
                        {hasDiscount && (
                          <span className="absolute top-1 left-1 bg-rose-500 text-white text-[9px] font-bold px-1 rounded">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</h4>
                          {p.delivery_type === "manual" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              🕒 Manual
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              ⚡ Auto
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.category} •{" "}
                          {hasDiscount ? (
                            <>
                              <span className="line-through text-slate-400 dark:text-slate-500">${p.price}</span>{" "}
                              <strong className="text-emerald-500 dark:text-emerald-400">${p.discount_price}</strong>
                            </>
                          ) : (
                            <strong>${p.price}</strong>
                          )}
                          {" "}• Stock:{" "}
                          {p.delivery_type === "manual" ? (
                            <strong className="text-amber-500 dark:text-amber-400">Manual Delivery</strong>
                          ) : (
                            <strong className={stock > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}>
                              {stock} codes
                            </strong>
                          )}
                          {" "}• Sold: {p.sold_count || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEditProduct(p)}
                        className="text-xs text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
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

      {/* TAB 2: ADD / EDIT PRODUCT */}
      {activeTab === "add_product" && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {editingProductId ? "Edit Product" : "Add New Product"}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {productStep === 1 ? "Step 1 of 2: Product Information" : "Step 2 of 2: Delivery Method Setup"}
              </span>
            </div>
            {editingProductId && (
              <button
                type="button"
                onClick={resetProductForm}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
          {/* STEP 1: Basic Information */}
          {productStep === 1 && (
            <form onSubmit={handleProductStepOneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Discord Nitro 1 Month Global"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
              {/* Category Dropdown */}
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="" disabled>-- Select a Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Regular Price (USD $)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="9.99"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Discount Price (USD $ - Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="7.99"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-sky-500"
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
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
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
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Redemption instructions, region limitations, and key details..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md shadow-sky-500/20 flex items-center gap-2"
                >
                  <span>{submitting ? "Saving..." : "Next: Set Delivery Method →"}</span>
                </button>
              </div>
            </form>
          )}
          {/* STEP 2: Choose Delivery Method */}
          {productStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">How will this product be delivered?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select fulfillment method for <strong>{title}</strong>.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Automatic Delivery */}
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
                {/* Option 2: Manual Delivery */}
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
              {/* If Automatic Delivery: Show Codes input */}
              {deliveryType === "auto" ? (
                <div className="space-y-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Voucher / License Codes (One code per line)
                    </label>
                    <span className="text-xs font-mono text-sky-600 dark:text-sky-400">
                      Stock: {voucherCodes.split("\n").filter((c) => c.trim()).length} codes
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
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-300">
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
                  disabled={submitting}
                  onClick={handleProductStepTwoSubmit}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md shadow-emerald-500/20"
                >
                  {submitting ? "Finalizing..." : "Complete & Publish Product ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* TAB 3: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {editingCategoryId ? "Edit Category & Photo" : "Add New Category"}
              </h2>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steam, Xbox, PlayStation, Nintendo"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Master Icon / Photo</label>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                    {categoryImagePreview ? (
                      <img src={categoryImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">No Photo</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="admin-cat-img"
                      accept="image/*"
                      onChange={handleCategoryImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="admin-cat-img"
                      className="inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white"
                    >
                      {categoryImagePreview ? "Change Category Image" : "Upload Category Image"}
                    </label>
                    <p className="text-[11px] text-slate-500">This photo is automatically inherited by all products under this category</p>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md shadow-sky-500/20"
              >
                {submitting
                  ? "Processing..."
                  : editingCategoryId
                  ? "Update Category & Sync Products"
                  : "Save Category"}
              </button>
            </form>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              All Existing Categories ({categories.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.category.toLowerCase() === cat.name.toLowerCase()
                ).length;
                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">🎮</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{cat.name}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{count} products assigned</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditCategory(cat)}
                        className="text-xs text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* TAB 4: MERCHANTS / KYC MANAGEMENT */}
      {activeTab === "merchants" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Merchant Applications & KYC Verification ({sellers.length})
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Review identity documents, store information, and approve or reject seller privileges.
              </span>
            </div>
            <button
              onClick={fetchSellers}
              className="text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition"
            >
              Refresh List
            </button>
          </div>
          {sellers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm">
              No merchant applications registered yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sellers.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.shop_name}</h3>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            s.verification_status === "verified"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : s.verification_status === "rejected"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {s.verification_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Country: <strong className="text-slate-700 dark:text-slate-200">{s.country}</strong> • Seller ID:{" "}
                        <span className="font-mono text-sky-600 dark:text-sky-400 text-[11px]">{s.id}</span>
                      </p>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {s.verification_status !== "verified" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateSellerStatus(s.id, "verified")}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-emerald-500/20"
                        >
                          Approve ✓
                        </button>
                      )}
                      {s.verification_status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateSellerStatus(s.id, "rejected")}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Reject ✕
                        </button>
                      )}
                    </div>
                  </div>
                  {s.description && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 leading-relaxed">
                      <strong className="text-slate-500 dark:text-slate-400 block mb-0.5 text-[11px]">Store Bio:</strong>
                      {s.description}
                    </div>
                  )}
                  {/* KYC Documents Preview */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 dark:text-slate-300 gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                      <span>
                        Document Type: <strong className="text-sky-600 dark:text-sky-400">{s.document_type || "NID / Passport"}</strong>
                      </span>
                      <span>
                        Document No: <strong className="text-slate-900 dark:text-white font-mono">{s.document_number || "N/A"}</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Front Side */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                          Front Side Document:
                        </span>
                        {s.document_front_url ? (
                          <a
                            href={s.document_front_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-36 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 rounded-xl overflow-hidden relative group transition"
                          >
                            <img
                              src={s.document_front_url}
                              alt="Front Side"
                              className="w-full h-full object-contain p-2"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-xs text-white font-semibold">
                              View Full Size ↗
                            </div>
                          </a>
                        ) : (
                          <div className="h-36 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                            No front image uploaded
                          </div>
                        )}
                      </div>
                      {/* Back Side */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                          Back Side Document:
                        </span>
                        {s.document_back_url ? (
                          <a
                            href={s.document_back_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-36 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 rounded-xl overflow-hidden relative group transition"
                          >
                            <img
                              src={s.document_back_url}
                              alt="Back Side"
                              className="w-full h-full object-contain p-2"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-xs text-white font-semibold">
                              View Full Size ↗
                            </div>
                          </a>
                        ) : (
                          <div className="h-36 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                            No back image uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* TAB 5: SUPPORT TICKETS */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Customer & Seller Support Tickets ({tickets.length})
            </h2>
            <button
              onClick={fetchTickets}
              className="text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 transition"
            >
              Refresh Tickets
            </button>
          </div>
          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm">
              No support tickets submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">#{t.id} - {t.subject}</span>
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
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        From: <strong className="text-slate-700 dark:text-slate-200">{t.user_name || "User"}</strong> ({t.user_email}) • Role: <span className="uppercase text-sky-600 dark:text-sky-400 font-mono">{t.role || "buyer"}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {t.message}
                  </div>
                  
                  {/* ===================================== */}
                  {/* NEW: Chat Room Link for Admin */}
                  {/* ===================================== */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      Ticket Status: {t.status}
                    </span>
                    
                    <Link
                      href={`/ticket/${t.id}`}
                      className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                    >
                      <span>Open Chat Room</span>
                      <span>💬</span>
                    </Link>
                  </div>
                  {/* End Chat Room Link */}

                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}