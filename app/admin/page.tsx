"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// 🔑 তোমার দেওয়া সংশোধিত গোপন পাসওয়ার্ড:
const ADMIN_SECRET_PIN = "Illustrator6!";

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState("");

  // প্রোডাক্ট ম্যানেজমেন্ট স্টেট
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ই-বুক ও গাইড");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // ব্রাউজার সেশনে লগইন স্ট্যাটাস চেক করা
  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_logged_in");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // ডাটাবেস থেকে সব প্রোডাক্ট লোড করা
  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, category, price, description, image_url")
      .order("id", { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  // পাসওয়ার্ড ভেরিফিকেশন
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === ADMIN_SECRET_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_logged_in", "true");
      setPinError("");
    } else {
      setPinError("ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।");
    }
  };

  // লগআউট ফাংশন
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_logged_in");
    setInputPin("");
  };

  // এডিট মোড চালু করা
  const handleEdit = (item: Product) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setPrice(item.price.toString());
    setDescription(item.description || "");
    setImageUrl(item.image_url || "");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // এডিট বাতিল করা
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setCategory("ই-বুক ও গাইড");
    setPrice("");
    setDescription("");
    setImageUrl("");
  };

  // নতুন প্রোডাক্ট যোগ বা আপডেট
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update({
            title,
            category,
            price: Number(price),
            description,
            image_url: imageUrl,
          })
          .eq("id", editingId);

        if (error) throw error;
        setMessage("✅ প্রোডাক্টের তথ্য সফলভাবে আপডেট হয়েছে!");
      } else {
        const { error } = await supabase.from("products").insert([
          {
            title,
            category,
            price: Number(price),
            description,
            image_url: imageUrl,
          },
        ]);

        if (error) throw error;
        setMessage("✅ নতুন প্রোডাক্ট সফলভাবে যোগ করা হয়েছে!");
      }

      handleCancelEdit();
      fetchProducts();
    } catch (err: any) {
      setMessage(`❌ সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // প্রোডাক্ট ডিলিট
  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("তুমি কি নিশ্চিত এই প্রোডাক্টটি ডিলিট করতে চাও?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("ডিলিট করতে সমস্যা হয়েছে!");
    } else {
      setProducts(products.filter((item) => item.id !== id));
      if (editingId === id) handleCancelEdit();
    }
  };

  // 🔒 লগইন করা না থাকলে পাসওয়ার্ড স্ক্রিন দেখাবে
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center text-2xl mx-auto">
            🔐
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">অ্যাডমিন প্রবেশাধিকার</h1>
            <p className="text-xs text-slate-400 mt-1">
              ড্যাশবোর্ডে প্রবেশ করতে সিক্রেট পাসওয়ার্ড দিন
            </p>
          </div>

          {pinError && (
            <div className="text-xs bg-rose-950/60 border border-rose-500/30 text-rose-400 p-2.5 rounded-lg">
              {pinError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              placeholder="পাসওয়ার্ড লিখুন"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-base tracking-wider text-white focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl transition text-sm shadow-lg shadow-sky-500/20"
            >
              প্রবেশ করুন →
            </button>
          </form>

          <Link href="/" className="inline-block text-xs text-slate-500 hover:text-slate-400">
            ← হোমপেজে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  // 🔓 পাসওয়ার্ড সঠিক হলে ড্যাশবোর্ড দেখাবে
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* টপ বার */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div>
            <h1 className="text-2xl font-bold text-sky-400">অ্যাডমিন ড্যাশবোর্ড</h1>
            <p className="text-sm text-slate-400">প্রোডাক্ট যোগ, এডিট বা ডিলিট করো</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg transition text-slate-300">
              হোমপেজ
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-3.5 py-2 rounded-lg transition border border-rose-500/20"
            >
              লগআউট
            </button>
          </div>
        </div>

        {/* ফর্ম সেকশন */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              {editingId ? "✏️ প্রোডাক্ট এডিট করুন" : "➕ নতুন প্রোডাক্ট আপলোড"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition"
              >
                বাতিল করুন
              </button>
            )}
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl text-sm font-medium mb-6 ${
                message.startsWith("✅")
                  ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/60 border border-rose-500/40 text-rose-300"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">প্রোডাক্টের নাম</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: ওয়ার্ডপ্রেস থিম"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ক্যাটাগরি</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                >
                  <option value="ই-বুক ও গাইড">ই-বুক ও গাইড</option>
                  <option value="সফটওয়্যার ও টুলস">সফটওয়্যার ও টুলস</option>
                  <option value="ওয়েব টেমপ্লেট">ওয়েব টেমপ্লেট</option>
                  <option value="অডিও ও সাউন্ড ইফেক্ট">অডিও ও সাউন্ড ইফেক্ট</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">মূল্য (টাকায়)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="যেমন: 499"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ছবির লিঙ্ক (URL)</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">সংক্ষিপ্ত বিবরণ</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="প্রোডাক্ট সম্পর্কে লিখুন..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-2.5 rounded-lg transition text-sm text-white ${
                editingId
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-sky-500 hover:bg-sky-600"
              } disabled:bg-slate-700`}
            >
              {loading
                ? "প্রসেসিং..."
                : editingId
                ? "আপডেট নিশ্চিত করুন"
                : "প্রোডাক্ট যোগ করুন"}
            </button>
          </form>
        </div>

        {/* বর্তমান প্রোডাক্টসমূহ */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4 text-white">
            বর্তমান প্রোডাক্টসমূহ ({products.length})
          </h2>

          {products.length === 0 ? (
            <p className="text-sm text-slate-500">কোনো প্রোডাক্ট পাওয়া যায়নি।</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {products.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {item.category} • ৳{item.price}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition border border-sky-500/20"
                    >
                      এডিট
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition border border-rose-500/20"
                    >
                      ডিলিট
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}