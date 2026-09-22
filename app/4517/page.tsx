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

  const [activeTab, setActiveTab] = useState<"products" | "categories" | "crawler" | "tickets">("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(10);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlerProgress, setCrawlerProgress] = useState<string>("");
  const [totalCrawledItems, setTotalCrawledItems] = useState<number>(0);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [voucherCodes, setVoucherCodes] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [existingProductImageUrl, setExistingProductImageUrl] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [existingCategoryImageUrl, setExistingCategoryImageUrl] = useState<string | null>(null);

  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [ticketStatusSelect, setTicketStatusSelect] = useState<"open" | "in_progress" | "resolved">("resolved");
  const [updatingTicket, setUpdatingTicket] = useState(false);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_authenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      fetchCategories();
      fetchProducts();
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
    if (data) {
      setCategories(data);
      if (data.length > 0 && !category) setCategory(data[0].name);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("id", { ascending: false });
    if (data) setProducts(data);
  };

  const fetchTickets = async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("id", { ascending: false });
    if (data) setTickets(data);
  };

  const handleStartMultiPageCrawl = async () => {
    if (startPage < 1 || endPage < startPage) {
      alert("Please enter a valid page range (e.g. Page 1 to 10)");
      return;
    }

    setIsCrawling(true);
    let totalItems = 0;

    for (let p = startPage; p <= endPage; p++) {
      setCrawlerProgress(`Fetching Page ${p} of ${endPage}... Do not close this browser window.`);
      try {
        const res = await fetch(`/api/cron/sync-bsv?page=${p}`);
        const data = await res.json();
        if (data.success) {
          totalItems += data.count || 0;
          setTotalCrawledItems(totalItems);
          setCrawlerProgress(`Page ${p} Completed (${data.count} items imported). Total synced: ${totalItems}`);
        } else {
          setCrawlerProgress(`Page ${p} Notice: ${data.message || "No products found"}`);
        }
      } catch (err: any) {
        setCrawlerProgress(`Error on Page ${p}: ${err.message}`);
      }

      await new Promise((r) => setTimeout(r, 600));
    }

    setIsCrawling(false);
    setCrawlerProgress(`Sync Completed! Processed pages ${startPage} through ${endPage}. Total imported: ${totalItems}`);
    await fetchProducts();
    await fetchCategories();
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImageFile(file);
      setProductImagePreview(URL.createObjectURL(file));
    }
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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      let finalImageUrl = existingProductImageUrl;

      if (productImageFile) {
        finalImageUrl = await uploadImageToStorage(productImageFile, "admin-products");
      }

      const payload = {
        title: title.trim(),
        category,
        price: parseFloat(price),
        image_url: finalImageUrl,
        description: description.trim(),
        voucher_codes: voucherCodes.trim(),
        seller_name: "Official Store",
      };

      if (editingProductId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProductId);
        if (error) throw error;
        setMessage("Official Product updated successfully.");
      } else {
        const { error } = await supabase.from("products").insert([{ ...payload, views: 0, sold_count: 0 }]);
        if (error) throw error;
        setMessage("Official Product published successfully.");
      }

      resetProductForm();
      await fetchProducts();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setTitle("");
    setPrice("");
    setDescription("");
    setVoucherCodes("");
    setProductImageFile(null);
    setProductImagePreview(null);
    setExistingProductImageUrl(null);
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setPrice(p.price.toString());
    setDescription(p.description);
    setVoucherCodes(p.voucher_codes || "");
    setExistingProductImageUrl(p.image_url);
    setProductImagePreview(p.image_url);
    setProductImageFile(null);
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to permanently remove this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) fetchProducts();
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
        setMessage("Category updated successfully.");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        setMessage("Category created successfully.");
      }

      resetCategoryForm();
      await fetchCategories();
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

  const handleUpdateTicket = async (ticketId: number) => {
    setUpdatingTicket(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          admin_reply: ticketReplyText.trim(),
          status: ticketStatusSelect,
        })
        .eq("id", ticketId);

      if (error) throw error;

      setActiveTicketId(null);
      setTicketReplyText("");
      await fetchTickets();
    } catch (err: any) {
      alert(`Ticket update failed: ${err.message}`);
    } finally {
      setUpdatingTicket(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center text-xl font-bold">
              🔒
            </div>
            <h1 className="text-lg font-bold text-white">Administrative Key</h1>
            <p className="text-xs text-slate-400">
              Enter your master key to access the control panel
            </p>
          </div>

          {passwordError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Passkey
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter access code..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-950"
            >
              Unlock Console →
            </button>
          </form>

          <div className="text-center">
            <Link href="/" className="text-[11px] text-slate-500 hover:text-slate-400">
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <Link
          href="https://inskeys.com"
          className="flex items-center gap-3 group transition hover:opacity-95"
        >
          <div className="shrink-0 flex items-center justify-center">
            <Image
              src="/icon.png"
              alt="Inskeys"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight group-hover:text-sky-400 transition">
              Inskeys Admin Console
            </h1>
            <span className="text-xs text-sky-400 font-mono">Route: /4517 • Master Authorized</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("crawler")}
            className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sky-950"
          >
            <span>🚀</span>
            <span>Crawl Pages (1–437)</span>
          </button>
          <Link
            href="/"
            className="text-xs bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl hover:text-white text-slate-400 transition"
          >
            Storefront
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-3 py-2 rounded-xl transition cursor-pointer"
            title="Lock Portal"
          >
            🔒 Lock
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-300">
          {message}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "products"
              ? "bg-slate-800 text-sky-400 border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📦 Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "categories"
              ? "bg-slate-800 text-sky-400 border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🏷️ Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "tickets"
              ? "bg-slate-800 text-sky-400 border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🎫 Support Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab("crawler")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "crawler"
              ? "bg-sky-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          ⚡ Batch Crawler
        </button>
      </div>

      {activeTab === "tickets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Customer & Seller Support Tickets ({tickets.length})
            </h2>
            <button
              onClick={fetchTickets}
              className="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 transition"
            >
              Refresh Tickets
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No support tickets submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">#{t.id} - {t.subject}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          t.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : t.status === "in_progress"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        From: <strong className="text-slate-200">{t.user_name || "User"}</strong> ({t.user_email}) • Role: <span className="uppercase text-sky-400 font-mono">{t.role || "buyer"}</span>
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {t.message}
                  </div>

                  {t.admin_reply && (
                    <div className="bg-sky-950/20 border border-sky-800/40 p-3 rounded-xl text-xs text-sky-200 space-y-1">
                      <span className="text-[10px] font-bold text-sky-400 uppercase">Existing Administrative Reply:</span>
                      <p>{t.admin_reply}</p>
                    </div>
                  )}

                  {activeTicketId === t.id ? (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <label className="block text-xs font-bold text-slate-200">
                        Write Official Resolution Reply
                      </label>
                      <textarea
                        rows={3}
                        value={ticketReplyText}
                        onChange={(e) => setTicketReplyText(e.target.value)}
                        placeholder="Provide response or resolution steps..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />

                      <div className="flex items-center gap-3">
                        <select
                          value={ticketStatusSelect}
                          onChange={(e) => setTicketStatusSelect(e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="open">Open</option>
                        </select>

                        <button
                          type="button"
                          disabled={updatingTicket}
                          onClick={() => handleUpdateTicket(t.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
                        >
                          {updatingTicket ? "Saving..." : "Send Reply & Update Status"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTicketId(null)}
                          className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTicketId(t.id);
                        setTicketReplyText(t.admin_reply || "");
                        setTicketStatusSelect(t.status);
                      }}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-1.5 rounded-lg transition"
                    >
                      {t.admin_reply ? "Edit Official Reply" : "Resolve / Reply to Ticket →"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "crawler" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
              Automated Catalog Sync
            </span>
            <h2 className="text-lg font-bold text-white">
              Sync External Catalog Across Batches (Pages 1 to 437)
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              To prevent execution timeouts, select page intervals (e.g. Page 1 to 10). Products, categories, images, and price calculations (+5% margin) will sync safely into Supabase.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Page
              </label>
              <input
                type="number"
                min="1"
                max="437"
                value={startPage}
                onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                End Page (Up to 437)
              </label>
              <input
                type="number"
                min="1"
                max="437"
                value={endPage}
                onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleStartMultiPageCrawl}
              disabled={isCrawling}
              className="w-full sm:w-auto px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-950 flex items-center justify-center gap-2"
            >
              <span>{isCrawling ? "Crawling in Progress..." : `Start Sync for Pages ${startPage} to ${endPage}`}</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">
              Total Imported: <strong className="text-sky-400">{totalCrawledItems}</strong> products
            </span>
          </div>

          {crawlerProgress && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-emerald-400 font-mono leading-relaxed">
              {crawlerProgress}
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingProductId ? "Edit Official Listing & Codes" : "Add Official Store Listing"}
              </h2>
              {editingProductId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Steam $10 USD Global Key"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price (USD $)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="9.99"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Image</label>
                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="w-14 h-14 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center">
                    {productImagePreview ? (
                      <img src={productImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-500">No Image</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="admin-prod-img"
                      accept="image/*"
                      onChange={handleProductImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="admin-prod-img"
                      className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition"
                    >
                      {productImagePreview ? "Change Image" : "Upload Image from Device"}
                    </label>
                    <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Redemption instructions and details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Voucher / License Codes (One code per line)
                  </label>
                  <span className="text-xs font-mono text-sky-400">
                    Stock: {voucherCodes.split("\n").filter((c) => c.trim()).length} codes
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={voucherCodes}
                  onChange={(e) => setVoucherCodes(e.target.value)}
                  placeholder="CODE-XXXXX-1111&#10;CODE-YYYYY-2222"
                  className="w-full font-mono bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-lg shadow-sky-950"
              >
                {submitting
                  ? "Processing..."
                  : editingProductId
                  ? "Update Official Product"
                  : "Publish Official Product"}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              All Listed Products ({products.length})
            </h3>
            <div className="space-y-2">
              {products.map((p) => {
                const stock = p.voucher_codes
                  ? p.voucher_codes.split("\n").filter((c) => c.trim()).length
                  : 0;

                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-500 flex items-center justify-center h-full">
                            No Img
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {p.category} • ${p.price} • Stock:{" "}
                          <strong className={stock > 0 ? "text-emerald-400" : "text-rose-400"}>
                            {stock} codes
                          </strong>{" "}
                          • Sold: {p.sold_count || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEditProduct(p)}
                        className="text-xs text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Edit / Stock
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
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

      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                {editingCategoryId ? "Edit Category & Photo" : "Add New Category"}
              </h2>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steam, Xbox, PlayStation, Nintendo"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Icon / Photo</label>
                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="w-14 h-14 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center">
                    {categoryImagePreview ? (
                      <img src={categoryImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-500">No Photo</span>
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
                      className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition"
                    >
                      {categoryImagePreview ? "Change Category Image" : "Upload Category Image"}
                    </label>
                    <p className="text-[11px] text-slate-500">Square PNG, JPG, or SVG recommended</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-lg shadow-sky-950"
              >
                {submitting
                  ? "Processing..."
                  : editingCategoryId
                  ? "Update Category"
                  : "Save Category"}
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-500">🎮</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{cat.name}</h4>
                        <p className="text-[10px] text-slate-400">{count} products assigned</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditCategory(cat)}
                        className="text-xs text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
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
    </div>
  );
}