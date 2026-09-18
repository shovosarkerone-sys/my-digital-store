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

  // এডিটিং স্টেট
  const [editingId, setEditingId] = useState<number | null>(null);

  // ফর্ম স্টেট
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [voucherCodes, setVoucherCodes] = useState("");

  // সরাসরি ডিভাইস থেকে ইমেজ আপলোড
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (PNG, JPG, WEBP).");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // এডিট শুরু করা
  const startEditProduct = (p: any) => {
    setEditingId(p.id);
    setTitle(p.title);
    setCategory(p.category);
    setPrice(p.price.toString());
    setDescription(p.description);
    setVoucherCodes(p.voucher_codes || "");
    setExistingImageUrl(p.image_url || null);
    setImagePreview(p.image_url || null);
    setImageFile(null);
    setActiveTab("add_product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // এডিট বাতিল করা
  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setPrice("");
    setDescription("");
    setVoucherCodes("");
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setActiveTab("products");
  };

  // প্রোডাক্ট পাবলিশ বা আপডেট হ্যান্ডলার
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduct(true);
    setActionMsg("");

    try {
      let finalImageUrl = existingImageUrl;

      // নতুন ছবি সিলেক্ট করা থাকলে আপলোড হবে
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        finalImageUrl = urlData.publicUrl;
      }

      const payload = {
        title: title.trim(),
        category: category,
        price: parseFloat(price),
        image_url: finalImageUrl,
        description: description.trim(),
        seller_id: user.id,
        seller_name: seller.shop_name,
        voucher_codes: voucherCodes.trim(),
      };

      if (editingId) {
        // আপডেট মোড
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId)
          .eq("seller_id", user.id);

        if (error) throw error;
        setActionMsg("✅ Product & Stock updated successfully!");
      } else {
        // নতুন প্রোডাক্ট মোড
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans text-sm">
        Loading Merchant Hub...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* টপ বার */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-sm text-white">
              S
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Shovo<span className="text-sky-400">Store</span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              Buyer Panel
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              Storefront
            </Link>
          </div>
        </div>

        {/* সেলার প্রোফাইল */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-sky-400">
              {seller.shop_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">{seller.shop_name}</h1>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-medium">
                  {seller.seller_level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Region: <span className="text-slate-200">{seller.country}</span> | Active Listings:{" "}
                <span className="text-sky-400 font-semibold">{myProducts.length}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              cancelEdit();
              setActiveTab("add_product");
            }}
            className="w-full sm:w-auto text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            Create New Listing
          </button>
        </div>

        {/* ট্যাব সুইচ */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              activeTab === "products"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            My Listings ({myProducts.length})
          </button>
          <button
            onClick={() => setActiveTab("add_product")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              activeTab === "add_product"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {editingId ? "Edit Listing & Stock" : "Add Product"}
          </button>
          <button
            onClick={() => setActiveTab("finances")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              activeTab === "finances"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Escrow & Earnings
          </button>
        </div>

        {actionMsg && (
          <div className="p-3.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-slate-200">
            {actionMsg}
          </div>
        )}

        {/* ট্যাব ১: মাই প্রোডাক্টস তালিকা */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {myProducts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
                <h3 className="text-sm font-semibold text-white">No products listed yet</h3>
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
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 bg-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-700">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">NO IMG</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider block">
                            {p.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-1 truncate">
                            {p.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>Price: <strong className="text-white">${p.price}</strong></span>
                            <span>•</span>
                            <span>
                              Stock:{" "}
                              <strong className={stock > 0 ? "text-emerald-400" : "text-rose-400"}>
                                {stock} codes
                              </strong>
                            </span>
                            <span>•</span>
                            <span>Sold: {p.sold_count || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* সেলারের জন্য এডিট ও স্টক ম্যানেজ বাটন */}
                        <button
                          onClick={() => startEditProduct(p)}
                          className="text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Edit / Stock
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
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

        {/* ট্যাব ২: প্রোডাক্ট অ্যাড / এডিট ফর্ম */}
        {activeTab === "add_product" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingId ? "Edit Product Listing & Stock" : "Publish New Digital Listing"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingId
                    ? "Add or remove voucher codes below to adjust stock instantly."
                    : "Upload image, set price, and add stock keys for instant delivery."}
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
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
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
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
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
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

              {/* ফটো আপলোড সেকশন */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Product Thumbnail Photo
                </label>

                <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-500 text-center font-mono">No Photo</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      id="product-photo"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="product-photo"
                      className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium cursor-pointer transition"
                    >
                      {imageFile || imagePreview ? "Change Image" : "Upload Image from Device"}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {imageFile ? imageFile.name : "Supports JPG, PNG, WEBP (Max 5MB)"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
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

              {/* ভাউচার কোড / স্টক ম্যানেজমেন্ট বক্স */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    Voucher / License Codes (One code per line)
                  </label>
                  <span className="text-xs font-mono text-sky-400">
                    Current Stock:{" "}
                    <strong>
                      {voucherCodes.split("\n").filter((c) => c.trim()).length}
                    </strong>{" "}
                    items
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={voucherCodes}
                  onChange={(e) => setVoucherCodes(e.target.value)}
                  placeholder="CODE-XXXXX-1111&#10;CODE-YYYYY-2222&#10;CODE-ZZZZZ-3333"
                  className="w-full font-mono bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 নতুন কোড পেস্ট করলে স্টক বাড়বে। কোনো লাইন মুছে দিলে স্বয়ংক্রিয়ভাবে স্টক কমে যাবে।
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-sky-950 cursor-pointer"
                >
                  {submittingProduct
                    ? "Saving Changes..."
                    : editingId
                    ? "Update Listing & Stock Codes"
                    : "Publish Product Listing"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ট্যাব ৩: ফাইন্যান্স ও এসক্রো সামারি */}
        {activeTab === "finances" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                  Available for Withdrawal
                </span>
                <span className="text-2xl font-bold text-emerald-400">
                  ${seller.balance || "0.00"}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                  Escrow Hold Balance (24–36h)
                </span>
                <span className="text-2xl font-bold text-amber-400">
                  ${seller.hold_balance || "0.00"}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                  Completed Orders
                </span>
                <span className="text-2xl font-bold text-sky-400">
                  {seller.total_sales || 0}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 space-y-2 leading-relaxed">
              <h3 className="font-semibold text-white text-sm">Escrow Protection & Withdrawal Overview</h3>
              <p>
                • Completed order funds remain in <strong>Hold Balance</strong> for 24 to 36 hours to safeguard buyer validity.
              </p>
              <p>
                • After the dispute clearance period, funds automatically transfer to your <strong>Available Balance</strong>.
              </p>
              <p>
                • Cryptocurrency payout requests are processed according to network confirmation fees.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}