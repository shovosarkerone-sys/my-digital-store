'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: number | string;
  name: string;
}

interface Product {
  id: number | string;
  title?: string;
  price?: number;
  category?: string;
  image_url?: string;
  description?: string;
  views?: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [productForm, setProductForm] = useState({
    title: '',
    price: '',
    category: '',
    image_url: '',
    description: '',
  });
  const [editingProductId, setEditingProductId] = useState<number | string | null>(null);

  const [newCategory, setNewCategory] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_session_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

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
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const showStatus = (text: string, isError: boolean = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === 'Illustrator6!') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_session_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect password! Please enter the valid security password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session_auth');
    setIsAuthenticated(false);
    setInputPassword('');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, price, category, image_url, description } = productForm;

    if (!title.trim()) {
      showStatus('❌ Please provide a valid product title.', true);
      return;
    }

    setSubmitting(true);
    const cleanPrice = parseFloat(price);
    const payload = {
      title: title.trim(),
      price: isNaN(cleanPrice) ? 0 : cleanPrice,
      category: category.trim() || null,
      image_url: image_url.trim() || null,
      description: description.trim() || null,
      views: 0,
    };

    try {
      if (editingProductId) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProductId);

        if (error) {
          showStatus(`❌ Update failed: ${error.message}`, true);
        } else {
          showStatus('✅ Product updated successfully!');
          resetProductForm();
          fetchData();
        }
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload]);

        if (error) {
          showStatus(`❌ Insert failed: ${error.message}`, true);
        } else {
          showStatus('✅ New product added successfully!');
          resetProductForm();
          fetchData();
        }
      }
    } catch (err: any) {
      showStatus(`❌ System error: ${err?.message || 'Unknown error'}`, true);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({
      title: prod.title || '',
      price: prod.price !== undefined ? String(prod.price) : '',
      category: prod.category || '',
      image_url: prod.image_url || '',
      description: prod.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      title: '',
      price: '',
      category: '',
      image_url: '',
      description: '',
    });
  };

  const handleDeleteProduct = async (id: number | string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${title}"?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      showStatus(`❌ Delete failed: ${error.message}`, true);
    } else {
      showStatus('🗑️ Product deleted successfully!');
      fetchData();
    }
  };

  const handleQuickMoveCategory = async (productId: number | string, newCat: string) => {
    const { error } = await supabase
      .from('products')
      .update({ category: newCat || null })
      .eq('id', productId);

    if (error) {
      showStatus(`❌ Category move failed: ${error.message}`, true);
    } else {
      showStatus('✅ Category updated successfully!');
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, category: newCat } : p))
      );
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategory.trim();
    if (!cleanName) return;

    const { error } = await supabase.from('categories').insert([{ name: cleanName }]);

    if (error) {
      showStatus(`❌ Category creation failed: ${error.message}`, true);
    } else {
      showStatus(`✅ Category "${cleanName}" created!`);
      setNewCategory('');
      fetchData();
    }
  };

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
      showStatus(`❌ Renaming failed: ${error.message}`, true);
      return;
    }

    await supabase
      .from('products')
      .update({ category: updated })
      .eq('category', oldName);

    showStatus(`✅ Category renamed to "${updated}"!`);
    setEditingCatId(null);
    fetchData();
  };

  const handleDeleteCategory = async (id: number | string, name: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${name}"? Linked products will become uncategorized.`
    );
    if (!confirmDelete) return;

    await supabase.from('products').update({ category: null }).eq('category', name);
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      showStatus(`❌ Delete failed: ${error.message}`, true);
    } else {
      showStatus(`🗑️ Category "${name}" deleted!`);
      fetchData();
    }
  };

  const filteredProducts = products.filter((p) => {
    const title = (p.title || '').toLowerCase();
    const matchesSearch = title.includes(productSearch.toLowerCase());
    const matchesCategory =
      filterCategory === 'ALL' ||
      (filterCategory === 'UNCATEGORIZED' ? !p.category : p.category === filterCategory);
    return matchesSearch && matchesCategory;
  });

  if (checkingAuth) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-950">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
              🔒
            </div>
            <h1 className="text-2xl font-black text-white">Admin Access</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Enter security password to access control center
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full pl-4 pr-12 py-3 text-sm font-semibold border border-slate-800 rounded-2xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-950 text-white placeholder:text-slate-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {authError && (
                <p className="text-xs font-bold text-rose-400 mt-2 text-center bg-rose-500/10 py-2 rounded-xl border border-rose-500/20">
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 bg-slate-950 min-h-screen text-white">
      {/* Header & Logout */}
      <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Admin Control Center</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Full management console for products, inventory, and categories
          </p>
        </div>

        <div className="flex items-center gap-3">
          {statusMessage && (
            <div
              className={`text-xs sm:text-sm px-4 py-2 rounded-xl font-bold shadow-md ${
                statusMessage.isError
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-sky-500 text-white'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔒</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>📦</span>
          <span>Products Management ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🏷️</span>
          <span>Categories Management ({categories.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold text-sm">
          Loading marketplace records...
        </div>
      ) : activeTab === 'products' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Product Form */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 sticky top-24">
              <h2 className="text-lg font-black text-white mb-4 flex items-center justify-between">
                <span>{editingProductId ? '✏️ Edit Product' : '➕ Add New Product'}</span>
                {editingProductId && (
                  <button
                    onClick={resetProductForm}
                    className="text-xs font-semibold text-rose-400 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </h2>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="e.g. Windows 11 Professional License"
                    className="w-full px-3.5 py-2 text-sm border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Price ($) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 text-sm border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-950 text-white font-medium"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://example.com/asset-preview.jpg"
                    className="w-full px-3.5 py-2 text-sm border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Key specifications, license terms, or instructions..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-950 text-white placeholder:text-slate-500 font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingProductId ? 'Save Changes' : 'Add Product'}
                </button>
              </form>
            </div>
          </div>

          {/* Product List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter products..."
                  className="w-full sm:w-64 px-4 py-2 text-xs border border-slate-800 rounded-xl bg-slate-950 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full sm:w-auto text-xs border border-slate-800 rounded-xl px-3 py-2 bg-slate-950 text-white font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="ALL">All Products ({products.length})</option>
                  <option value="UNCATEGORIZED">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500 font-medium">
                  No products found matching criteria
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 max-h-[640px] overflow-y-auto pr-1">
                  {filteredProducts.map((product) => {
                    const title = product.title || 'Untitled Asset';
                    const img = product.image_url;

                    return (
                      <div
                        key={product.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 p-2.5 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {img ? (
                            <img
                              src={img}
                              alt={title}
                              className="w-14 h-14 object-cover rounded-xl border border-slate-800 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                              No Image
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{title}</p>
                            <p className="text-xs text-sky-400 font-bold mt-0.5">${product.price}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                          <select
                            value={product.category || ''}
                            onChange={(e) => handleQuickMoveCategory(product.id, e.target.value)}
                            title="Quick Category Assignment"
                            className="text-xs font-bold border border-slate-800 rounded-xl px-2.5 py-1.5 bg-slate-950 text-white shadow-sm focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                          >
                            <option value="">No Category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => startEditProduct(product)}
                            className="px-3 py-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl transition cursor-pointer"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(product.id, title)}
                            className="px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition cursor-pointer"
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
        /* Categories Management */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
              <h2 className="text-base font-black text-white mb-3 flex items-center gap-2">
                <span>➕</span> Add New Category
              </h2>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Developer Tools, Templates"
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-950 text-white placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Create
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-white">
                  Active Categories ({categories.length})
                </h2>
                <span className="text-xs text-slate-400 font-bold">Total Products</span>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-500 font-medium">
                  No categories created yet
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto pr-1">
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
                              className="flex-1 px-3 py-1.5 text-sm font-bold border border-sky-500 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-950 text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditCategory(cat.id, cat.name)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCatId(null)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-bold text-white truncate">{cat.name}</span>
                              <span className="px-2.5 py-0.5 bg-slate-800 text-sky-400 rounded-full text-xs font-black">
                                {count}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditingCatName(cat.name);
                                }}
                                className="px-3 py-1 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-lg transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="px-3 py-1 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
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