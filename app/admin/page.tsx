'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: number | string;
  name: string;
}

interface Product {
  id: number | string;
  name?: string;
  title?: string;
  price?: number;
  category?: string;
  image_url?: string;
  image?: string;
  description?: string;
}

export default function AdminPage() {
  // সক্রিয় ট্যাব: 'products' অথবা 'categories'
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // প্রোডাক্ট ফর্মের স্টেট (অ্যাড ও এডিটের জন্য)
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: '',
    image_url: '',
    description: '',
  });
  const [editingProductId, setEditingProductId] = useState<number | string | null>(null);

  // ক্যাটাগরি ফর্মের স্টেট
  const [newCategory, setNewCategory] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // সার্চ ও ফিল্টার
  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // ডাটাবেস থেকে সব ডাটা আনা
  const fetchData = async () => {
    setLoading(true);

    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (catData) setCategories(catData);

    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (prodData) setProducts(prodData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3500);
  };

  // ----------------------------------------------------
  // ১. প্রোডাক্ট সম্পর্কিত কাজ (Add, Edit, Delete, Move)
  // ----------------------------------------------------

  // প্রোডাক্ট সাবমিট (নতুন যোগ অথবা এডিট সেভ)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, price, category, image_url, description } = productForm;

    if (!name.trim()) {
      showNotification('❌ প্রোডাক্টের নাম দিন');
      return;
    }

    const payload = {
      name: name.trim(),
      price: price ? parseFloat(price) : 0,
      category: category || '',
      image_url: image_url.trim(),
      description: description.trim(),
    };

    if (editingProductId) {
      // এডিট আপডেট
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProductId);

      if (error) {
        showNotification('❌ প্রোডাক্ট আপডেট করা যায়নি');
      } else {
        showNotification('✅ প্রোডাক্ট সফলভাবে আপডেট হয়েছে!');
        resetProductForm();
        fetchData();
      }
    } else {
      // নতুন প্রোডাক্ট যোগ
      const { error } = await supabase
        .from('products')
        .insert([payload]);

      if (error) {
        showNotification('❌ নতুন প্রোডাক্ট যোগ করা যায়নি');
      } else {
        showNotification('✅ নতুন প্রোডাক্ট সফলভাবে যুক্ত হয়েছে!');
        resetProductForm();
        fetchData();
      }
    }
  };

  // প্রোডাক্ট এডিট মোড শুরু করা
  const startEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name || prod.title || '',
      price: prod.price !== undefined ? String(prod.price) : '',
      category: prod.category || '',
      image_url: prod.image_url || prod.image || '',
      description: prod.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ফর্ম রিসেট
  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      price: '',
      category: '',
      image_url: '',
      description: '',
    });
  };

  // প্রোডাক্ট ডিলিট করা
  const handleDeleteProduct = async (id: number | string, name: string) => {
    const confirmDelete = window.confirm(`আপনি কি "${name}" প্রোডাক্টটি মুছে ফেলতে চান?`);
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      showNotification('❌ প্রোডাক্ট মুছে ফেলা যায়নি');
    } else {
      showNotification('🗑️ প্রোডাক্ট ডিলিট করা হয়েছে!');
      fetchData();
    }
  };

  // সরাসরি ড্রপডাউন থেকে ক্যাটাগরি মুভ করা
  const handleQuickMoveCategory = async (productId: number | string, newCat: string) => {
    const { error } = await supabase
      .from('products')
      .update({ category: newCat })
      .eq('id', productId);

    if (error) {
      showNotification('❌ ক্যাটাগরি পরিবর্তন করা যায়নি');
    } else {
      showNotification('✅ প্রোডাক্টের ক্যাটাগরি স্থানান্তরিত হয়েছে!');
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, category: newCat } : p))
      );
    }
  };

  // ----------------------------------------------------
  // ২. ক্যাটাগরি সম্পর্কিত কাজ (Add, Rename, Delete)
  // ----------------------------------------------------

  // নতুন ক্যাটাগরি যোগ
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategory.trim();
    if (!cleanName) return;

    const { error } = await supabase.from('categories').insert([{ name: cleanName }]);

    if (error) {
      showNotification('❌ ক্যাটাগরি তৈরি করা যায়নি (নামটি হয়তো আগেই আছে)');
    } else {
      showNotification(`✅ "${cleanName}" ক্যাটাগরি যোগ হয়েছে!`);
      setNewCategory('');
      fetchData();
    }
  };

  // ক্যাটাগরি রিনেম সেভ
  const handleSaveEditCategory = async (id: number | string, oldName: string) => {
    const updated = editingCatName.trim();
    if (!updated || updated === oldName) {
      setEditingCatId(null);
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({ name: updated })
      .eq('id', id);

    if (error) {
      showNotification('❌ ক্যাটাগরির নাম পরিবর্তন করা যায়নি');
      return;
    }

    // প্রোডাক্টগুলোতেও ক্যাটাগরির নাম সিঙ্ক করা
    await supabase
      .from('products')
      .update({ category: updated })
      .eq('category', oldName);

    showNotification(`✅ ক্যাটাগরি পরিবর্তন হয়ে "${updated}" হয়েছে!`);
    setEditingCatId(null);
    fetchData();
  };

  // ক্যাটাগরি ডিলিট
  const handleDeleteCategory = async (id: number | string, name: string) => {
    const confirmDelete = window.confirm(
      `আপনি কি "${name}" ক্যাটাগরি মুছে ফেলতে চান? সংশ্লিষ্ট প্রোডাক্টগুলো ক্যাটাগরিহীন হয়ে যাবে।`
    );
    if (!confirmDelete) return;

    await supabase.from('products').update({ category: '' }).eq('category', name);
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      showNotification('❌ ক্যাটাগরি ডিলিট করা যায়নি');
    } else {
      showNotification(`🗑️ "${name}" ক্যাটাগরি মুছে ফেলা হয়েছে!`);
      fetchData();
    }
  };

  // ফিল্টার করা প্রোডাক্ট লিস্ট
  const filteredProducts = products.filter((p) => {
    const title = (p.name || p.title || '').toLowerCase();
    const matchesSearch = title.includes(productSearch.toLowerCase());
    const matchesCategory =
      filterCategory === 'ALL' ||
      (filterCategory === 'UNCATEGORIZED' ? !p.category : p.category === filterCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 bg-gray-50 min-h-screen">
      {/* ড্যাশবোর্ড হেডার ও নোটিফিকেশন */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Control Center</h1>
          <p className="text-sm font-medium text-gray-600 mt-0.5">
            প্রোডাক্ট এবং ক্যাটাগরি সম্পূর্ণ পরিচালনা করার মূল প্যানেল
          </p>
        </div>

        {message && (
          <div className="bg-blue-600 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl font-bold shadow-md animate-fade-in">
            {message}
          </div>
        )}
      </div>

      {/* ট্যাব নেভিগেশন (প্রোডাক্ট বনাম ক্যাটাগরি) */}
      <div className="flex gap-3 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>📦</span>
          <span>প্রোডাক্ট ম্যানেজমেন্ট ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>🏷️</span>
          <span>ক্যাটাগরি ম্যানেজমেন্ট ({categories.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-600 font-bold text-sm">
          ডাটাবেস থেকে তথ্য লোড হচ্ছে...
        </div>
      ) : activeTab === 'products' ? (
        /* ==================== ১. প্রোডাক্ট ম্যানেজমেন্ট ট্যাব ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* প্রোডাক্ট অ্যাড / এডিট ফর্ম (৪ কলাম) */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24">
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center justify-between">
                <span>{editingProductId ? '✏️ প্রোডাক্ট এডিট করুন' : '➕ নতুন প্রোডাক্ট যোগ করুন'}</span>
                {editingProductId && (
                  <button
                    onClick={resetProductForm}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    বাতিল
                  </button>
                )}
              </h2>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">প্রোডাক্টের নাম *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="যেমন: ওয়ার্ডপ্রেস থিম, প্রিমিয়াম কোর্স"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 placeholder:text-gray-400 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">মূল্য (৳) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">ক্যাটাগরি</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-medium"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">ছবির লিংক (Image URL)</label>
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 placeholder:text-gray-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">বিবরণ (Description)</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="প্রোডাক্টের সংক্ষিপ্ত বিবরণ..."
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 placeholder:text-gray-400 font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
                >
                  {editingProductId ? 'পরিবর্তন সেভ করুন' : 'প্রোডাক্ট যুক্ত করুন'}
                </button>
              </form>
            </div>
          </div>

          {/* প্রোডাক্টের তালিকা ও কুইক মুভ (৮ কলাম) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              
              {/* সার্চ ও ফিল্টার বার */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="প্রোডাক্টের নাম দিয়ে খুঁজুন..."
                  className="w-full sm:w-64 px-4 py-2 text-xs border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full sm:w-auto text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">সকল প্রোডাক্ট ({products.length})</option>
                  <option value="UNCATEGORIZED">ক্যাটাগরি ছাড়া</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* প্রোডাক্ট রো তালিকা */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500 font-medium">
                  কোনো প্রোডাক্ট পাওয়া যায়নি
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[640px] overflow-y-auto pr-1">
                  {filteredProducts.map((product) => {
                    const title = product.name || product.title || 'নামহীন প্রোডাক্ট';
                    const img = product.image_url || product.image;

                    return (
                      <div
                        key={product.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 p-2.5 rounded-xl transition-colors"
                      >
                        {/* থাম্বনেইল ও ইনফো */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {img ? (
                            <img
                              src={img}
                              alt={title}
                              className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-[10px] text-gray-400 font-bold shrink-0">
                              ছবি নেই
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate">
                              {title}
                            </p>
                            <p className="text-xs text-blue-600 font-bold mt-0.5">
                              ৳ {product.price}
                            </p>
                          </div>
                        </div>

                        {/* ক্যাটাগরি পরিবর্তন ড্রপডাউন ও অ্যাকশন বাটন */}
                        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                          <select
                            value={product.category || ''}
                            onChange={(e) => handleQuickMoveCategory(product.id, e.target.value)}
                            title="ক্যাটাগরি মুভ করুন"
                            className="text-xs font-bold border border-gray-300 rounded-xl px-2.5 py-1.5 bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="">ক্যাটাগরি নেই</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => startEditProduct(product)}
                            className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(product.id, title)}
                            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
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
          </div>

        </div>
      ) : (
        /* ==================== ২. ক্যাটাগরি ম্যানেজমেন্ট ট্যাব ==================== */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* ক্যাটাগরি যোগ ফর্ম */}
          <div className="md:col-span-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
                <span>➕</span> নতুন ক্যাটাগরি যোগ করুন
              </h2>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="যেমন: টেমপ্লেট, সফটওয়্যার"
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  যোগ করুন
                </button>
              </form>
            </div>
          </div>

          {/* ক্যাটাগরি লিস্ট (Edit & Delete সহ) */}
          <div className="md:col-span-7">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-gray-900">
                  বর্তমান ক্যাটাগরিসমূহ ({categories.length})
                </h2>
                <span className="text-xs text-gray-500 font-bold">প্রোডাক্ট সংখ্যা</span>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500 font-medium">
                  কোনো ক্যাটাগরি পাওয়া যায়নি
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category === cat.name).length;

                    return (
                      <div key={cat.id} className="py-3.5 flex items-center justify-between gap-3">
                        {editingCatId === cat.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm font-bold border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditCategory(cat.id, cat.name)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCatId(null)}
                              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-bold text-gray-900 truncate">
                                {cat.name}
                              </span>
                              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-black">
                                {count}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditingCatName(cat.name);
                                }}
                                className="px-3 py-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="px-3 py-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}