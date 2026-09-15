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
}

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCategory, setNewCategory] = useState('');
  
  // ক্যাটাগরি এডিট করার স্টেট
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingName, setEditingName] = useState('');

  // ফিল্টার ও সার্চ স্টেট
  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // ডাটাবেস থেকে তথ্য লোড করা
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

  // ১. নতুন ক্যাটাগরি যোগ করা
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategory.trim();
    if (!cleanName) return;

    const { error } = await supabase
      .from('categories')
      .insert([{ name: cleanName }]);

    if (error) {
      showNotification('❌ ক্যাটাগরি যোগ করা যায়নি (হয়তো নামটি আগেই আছে)');
    } else {
      showNotification(`✅ "${cleanName}" ক্যাটাগরি সফলভাবে যোগ হয়েছে!`);
      setNewCategory('');
      fetchData();
    }
  };

  // ২. ক্যাটাগরি এডিট শুরু করা
  const startEditCategory = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  // ৩. ক্যাটাগরি নাম সংরক্ষণ করা
  const handleSaveEditCategory = async (id: number | string, oldName: string) => {
    const updatedName = editingName.trim();
    if (!updatedName || updatedName === oldName) {
      setEditingId(null);
      return;
    }

    const { error: catError } = await supabase
      .from('categories')
      .update({ name: updatedName })
      .eq('id', id);

    if (catError) {
      showNotification('❌ ক্যাটাগরির নাম পরিবর্তন করা যায়নি');
      return;
    }

    // সংশ্লিষ্ট প্রোডাক্টগুলোতেও ক্যাটাগরির নাম আপডেট হবে
    await supabase
      .from('products')
      .update({ category: updatedName })
      .eq('category', oldName);

    showNotification(`✅ ক্যাটাগরি পরিবর্তন হয়ে "${updatedName}" হয়েছে!`);
    setEditingId(null);
    fetchData();
  };

  // ৪. ক্যাটাগরি মুছে ফেলা
  const handleDeleteCategory = async (id: number | string, name: string) => {
    const confirmDelete = window.confirm(
      `আপনি কি নিশ্চিত যে "${name}" ক্যাটাগরি মুছে ফেলতে চান? \nএই ক্যাটাগরির প্রোডাক্টগুলো আন-ক্যাটাগোরাইজড হয়ে যাবে।`
    );
    if (!confirmDelete) return;

    await supabase
      .from('products')
      .update({ category: '' })
      .eq('category', name);

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      showNotification('❌ ক্যাটাগরি ডিলিট করা যায়নি');
    } else {
      showNotification(`🗑️ "${name}" ক্যাটাগরি মুছে ফেলা হয়েছে!`);
      fetchData();
    }
  };

  // ৫. প্রোডাক্ট ক্যাটাগরি মুভ করা
  const handleMoveProductCategory = async (productId: number | string, newCat: string) => {
    const { error } = await supabase
      .from('products')
      .update({ category: newCat })
      .eq('id', productId);

    if (error) {
      showNotification('❌ প্রোডাক্ট ক্যাটাগরি পরিবর্তন হয়নি');
    } else {
      showNotification('✅ প্রোডাক্টটি নতুন ক্যাটাগরিতে সরানো হয়েছে!');
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, category: newCat } : p))
      );
    }
  };

  const getProductCountByCategory = (catName: string) => {
    return products.filter((p) => p.category === catName).length;
  };

  const filteredProducts = products.filter((p) => {
    const name = (p.name || p.title || '').toLowerCase();
    const matchesSearch = name.includes(productSearch.toLowerCase());
    const matchesCategory =
      filterCategory === 'ALL' ||
      (filterCategory === 'UNCATEGORIZED' ? !p.category : p.category === filterCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-gray-50 min-h-screen">
      {/* ড্যাশবোর্ড হেডার */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-sm text-gray-600 mt-1">
            ক্যাটাগরি যুক্ত, এডিট, ডিলিট এবং প্রোডাক্ট সহজে মুভ করার সম্পূর্ণ ড্যাশবোর্ড
          </p>
        </div>

        {message && (
          <div className="bg-blue-600 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl font-medium shadow-md">
            {message}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-600 font-medium text-sm">
          ডাটা লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* বাম পাশ: সম্পূর্ণ ক্যাটাগরি ম্যানেজমেন্ট */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* নতুন ক্যাটাগরি তৈরি */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>➕</span> নতুন ক্যাটাগরি যোগ করুন
              </h2>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="যেমন: ই-বুক, সফটওয়্যার..."
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  যোগ করুন
                </button>
              </form>
            </div>

            {/* সব ক্যাটাগরি লিস্ট */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">
                  সকল ক্যাটাগরি ({categories.length})
                </h2>
                <span className="text-xs text-gray-500 font-medium">প্রোডাক্ট সংখ্যা সহ</span>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  কোনো ক্যাটাগরি পাওয়া যায়নি
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <div key={cat.id} className="py-3 flex items-center justify-between gap-3">
                      {editingId === cat.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm font-medium border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEditCategory(cat.id, cat.name)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg"
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
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] font-bold">
                              {getProductCountByCategory(cat.name)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => startEditCategory(cat)}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title="নাম পরিবর্তন করুন"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title="মুছে ফেলুন"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ডান পাশ: প্রোডাক্ট এক ক্যাটাগরি থেকে অন্য ক্যাটাগরিতে মুভ করার প্যানেল */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    প্রোডাক্ট ক্যাটাগরি স্থানান্তর (Move)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ড্রপডাউন থেকে ক্যাটাগরি বদল করলেই প্রোডাক্টটি স্থানান্তরিত হয়ে যাবে
                  </p>
                </div>

                {/* ক্যাটাগরি অনুযায়ী ফিল্টার ড্রপডাউন */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">সব প্রোডাক্ট ({products.length})</option>
                  <option value="UNCATEGORIZED">ক্যাটাগরি নেই এমন</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* প্রোডাক্ট খোঁজার সার্চ বক্স */}
              <div className="mb-4">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="মুভ করার জন্য প্রোডাক্ট খুঁজুন..."
                  className="w-full px-4 py-2 text-xs border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* প্রোডাক্ট তালিকা */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  কোনো প্রোডাক্ট পাওয়া যায়নি
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto pr-1">
                  {filteredProducts.map((product) => {
                    const title = product.name || product.title || 'নামহীন প্রোডাক্ট';
                    const img = product.image_url || product.image;

                    return (
                      <div
                        key={product.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors"
                      >
                        {/* প্রোডাক্ট ইনফো */}
                        <div className="flex items-center gap-3 min-w-0">
                          {img ? (
                            <img
                              src={img}
                              alt={title}
                              className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                              ছবি নেই
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {title}
                            </p>
                            <p className="text-xs text-blue-600 font-bold mt-0.5">
                              ৳ {product.price}
                            </p>
                          </div>
                        </div>

                        {/* ক্যাটাগরি সিলেক্টর */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className="text-[11px] font-semibold text-gray-500">
                            বর্তমান:
                          </span>
                          <select
                            value={product.category || ''}
                            onChange={(e) =>
                              handleMoveProductCategory(product.id, e.target.value)
                            }
                            className="text-xs font-semibold border border-gray-300 rounded-xl px-3 py-1.5 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="">ক্যাটাগরি নেই (Unassigned)</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
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