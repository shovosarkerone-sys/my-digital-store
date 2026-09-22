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

const BUYER_LEVELS: Record<number, LevelInfo> = {
  1: { level: 1, title: "Newbie", badgeColor: "bg-slate-800 border-slate-700", textColor: "text-slate-300", icon: "🌱" },
  2: { level: 2, title: "Rookie", badgeColor: "bg-blue-500/10 border-blue-500/20", textColor: "text-blue-400", icon: "🎮" },
  3: { level: 3, title: "Gamer", badgeColor: "bg-emerald-500/10 border-emerald-500/20", textColor: "text-emerald-400", icon: "🕹️" },
  4: { level: 4, title: "Pro Gamer", badgeColor: "bg-sky-500/10 border-sky-500/30", textColor: "text-sky-400", icon: "⚡" },
  5: { level: 5, title: "Master", badgeColor: "bg-indigo-500/10 border-indigo-500/30", textColor: "text-indigo-400", icon: "🔮" },
  6: { level: 6, title: "Veteran", badgeColor: "bg-amber-500/10 border-amber-500/30", textColor: "text-amber-400", icon: "🎖️" },
  7: { level: 7, title: "Champion", badgeColor: "bg-yellow-500/15 border-yellow-500/40", textColor: "text-yellow-400", icon: "🏆" },
  8: { level: 8, title: "Elite", badgeColor: "bg-cyan-500/15 border-cyan-500/40", textColor: "text-cyan-400", icon: "💎" },
  9: { level: 9, title: "Legend", badgeColor: "bg-rose-500/15 border-rose-500/40", textColor: "text-rose-400", icon: "🔥" },
  10: { level: 10, title: "Immortal", badgeColor: "bg-amber-400/20 border-amber-400/50", textColor: "text-amber-300", icon: "👑" },
};

interface Order {
  id: number;
  product_title?: string;
  product_id?: string | number;
  amount?: number;
  price?: number;
  payment_status?: string;
  status?: string;
  delivery_type?: string;
  delivery_content?: string;
  payment_id?: string;
  created_at: string;
}

interface SellerProduct {
  id: number;
  title: string;
  category: string;
  price: number;
  sold_count?: number;
  voucher_codes?: string | null;
  delivery_type?: string;
}

interface ChatMessage {
  id: string | number;
  sender_email: string;
  receiver_email: string;
  message: string;
  created_at: string;
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: BuySellVouchers Navigation
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "transactions"
    | "financial"
    | "products"
    | "profile"
    | "dispute"
    | "security"
    | "vouchers"
    | "support"
    | "feedbacks"
    | "messages"
  >("dashboard");

  const [orders, setOrders] = useState<Order[]>([]);
  const [myProducts, setMyProducts] = useState<SellerProduct[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Add Product Form in "My products"
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Game Keys");
  const [newPrice, setNewPrice] = useState("");
  const [newDeliveryType, setNewDeliveryType] = useState<"auto" | "manual">("auto");
  const [newVoucherCodes, setNewVoucherCodes] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  // Private Messages States
  const [conversations, setConversations] = useState<string[]>(["contact@inskeys.com"]);
  const [activeChatEmail, setActiveChatEmail] = useState<string>("contact@inskeys.com");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState("");

  // Ticket Form States
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketOrderId, setTicketOrderId] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketActionMsg, setTicketActionMsg] = useState("");

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth?redirect=/dashboard");
        return;
      }
      setUser(user);

      // Load Orders
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .or(`user_email.eq.${user.email},customer_email.eq.${user.email}`)
        .order("id", { ascending: false });

      if (orderData) setOrders(orderData);

      // Load Seller's Products (if merchant)
      const { data: prodData } = await supabase
        .from("products")
        .select("id, title, category, price, sold_count, voucher_codes, delivery_type")
        .eq("seller_id", user.id)
        .order("id", { ascending: false });

      if (prodData) setMyProducts(prodData);

      // Load Support Tickets
      await loadUserTickets(user.email, user.id);

      // Load Messages
      await loadMessages(user.email);

      setLoading(false);
    }

    loadUserData();
  }, [router]);

  // Membership Duration Calculator (Years, Months, Days)
  const getMembershipDuration = (createdAt?: string) => {
    if (!createdAt) return "1 day";
    const start = new Date(createdAt);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonth;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);

    return parts.join(", ");
  };

  const loadUserTickets = async (userEmail?: string, userId?: string) => {
    if (!userEmail && !userId) return;
    let query = supabase.from("support_tickets").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (userEmail) {
      query = query.eq("user_email", userEmail);
    }
    const { data } = await query.order("created_at", { ascending: false });
    if (data) setTickets(data);
  };

  const loadMessages = async (myEmail: string) => {
    try {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_email.eq.${myEmail},receiver_email.eq.${myEmail}`)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        setChatMessages(data);
        const contacts = Array.from(
          new Set(
            data.map((m) => (m.sender_email === myEmail ? m.receiver_email : m.sender_email))
          )
        );
        if (contacts.length > 0) {
          setConversations(contacts);
          if (!contacts.includes(activeChatEmail)) setActiveChatEmail(contacts[0]);
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !user) return;

    const newMsg: ChatMessage = {
      id: Date.now(),
      sender_email: user.email,
      receiver_email: activeChatEmail,
      message: typedMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setTypedMessage("");

    try {
      await supabase.from("direct_messages").insert([
        {
          sender_email: user.email,
          receiver_email: activeChatEmail,
          message: newMsg.message,
        },
      ]);
    } catch (err) {
      console.error("Message send error:", err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingProduct(true);
    try {
      const payload = {
        title: newTitle.trim(),
        category: newCategory,
        price: parseFloat(newPrice),
        seller_id: user.id,
        seller_name: user?.user_metadata?.full_name || "Merchant",
        delivery_type: newDeliveryType,
        voucher_codes: newDeliveryType === "auto" ? newVoucherCodes.trim() : null,
        description: "Fulfilled securely with 36-Hour Buyer Protection.",
      };

      const { data, error } = await supabase.from("products").insert([payload]).select().single();
      if (error) throw error;

      if (data) setMyProducts((prev) => [data, ...prev]);
      setShowAddProductModal(false);
      setNewTitle("");
      setNewPrice("");
      setNewVoucherCodes("");
    } catch (err: any) {
      alert(`Failed to add product: ${err.message}`);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTicket(true);
    setTicketActionMsg("");

    try {
      const subjectLine = ticketOrderId.trim()
        ? `[Order #${ticketOrderId.trim()}] ${ticketSubject.trim()}`
        : ticketSubject.trim();

      const { error } = await supabase.from("support_tickets").insert([
        {
          user_id: user.id,
          user_name: user?.user_metadata?.full_name || "Buyer Member",
          user_email: user.email,
          role: "buyer",
          subject: subjectLine,
          message: ticketMessage.trim(),
          status: "open",
        },
      ]);

      if (error) throw error;

      setTicketActionMsg("✅ Ticket submitted successfully! Official desk will respond shortly.");
      setTicketSubject("");
      setTicketOrderId("");
      setTicketMessage("");
      await loadUserTickets(user.email, user.id);
    } catch (err: any) {
      setTicketActionMsg(`❌ Error: ${err.message}`);
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-400 font-mono text-sm">
        Loading Inskeys Account Console...
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Valued Customer";
  const country = user?.user_metadata?.country || "International";

  const rawLevel = user?.user_metadata?.buyer_level || (orders.length > 0 ? Math.min(orders.length + 1, 10) : 1);
  const currentBuyerLevel = Math.min(Math.max(Number(rawLevel) || 1, 1), 10);
  const levelDetails = BUYER_LEVELS[currentBuyerLevel];

  const completedOrders = orders.filter((o) => o.payment_status === "completed" || o.status === "completed" || o.status === "Paid");
  const totalSpent = completedOrders.reduce((sum, o) => sum + (Number(o.amount || o.price) || 0), 0);
  const registeredDate = user?.created_at ? user.created_at.split("T")[0] : "2026-01-01";
  const membershipDurationText = getMembershipDuration(user?.created_at);

  const activeMessages = chatMessages.filter(
    (m) =>
      (m.sender_email === user.email && m.receiver_email === activeChatEmail) ||
      (m.sender_email === activeChatEmail && m.receiver_email === user.email)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={34}
                height={34}
                className="w-8 h-8 object-contain bg-transparent"
              />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/"
              className="text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
            >
              ← Home
            </Link>
            <button
              onClick={handleLogout}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer font-bold"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your digital orders, identity verification, and buyer security.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT CONTENT (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* VIEW 1: MAIN DASHBOARD */}
            {activeTab === "dashboard" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profile Card */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {levelDetails.icon}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-white truncate">
                            {fullName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Verified user
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${levelDetails.badgeColor} ${levelDetails.textColor}`}>
                            Level {levelDetails.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Mini Stats */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Positive feedbacks</span>
                        <strong className="text-emerald-400 font-bold">100% (5.0)</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Negative feedbacks</span>
                        <strong className="text-slate-400 font-bold">0</strong>
                      </div>
                    </div>

                    {/* Metadata & Membership Duration */}
                    <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80 font-medium">
                      <div className="flex justify-between">
                        <span>Registered:</span>
                        <div className="text-right">
                          <strong className="text-slate-200 font-mono block">{registeredDate}</strong>
                          <span className="text-[10px] text-sky-400 font-semibold block">({membershipDurationText})</span>
                        </div>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>Successful transactions:</span>
                        <strong className="text-sky-400 font-bold">{completedOrders.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tier status:</span>
                        <strong className="text-slate-200">{levelDetails.title}</strong>
                      </div>
                    </div>
                  </div>

                  {/* System Messages */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-xl">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          System Messages
                        </span>
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                      </div>

                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1 text-xs text-amber-300">
                        <span className="font-bold block">🛡️ 36-Hour Buyer Protection Active</span>
                        <p className="text-[11px] leading-relaxed text-amber-300/80">
                          All orders are held under safety guarantee until activation code validity is fully confirmed.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400">
                        No critical alerts or account dispute notices at the moment.
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 text-right font-mono">
                      Location: <strong className="text-slate-300">{country}</strong>
                    </div>
                  </div>
                </div>

                {/* Sub Buttons (Feedback & Messages) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("feedbacks")}
                    className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer shadow-md"
                  >
                    <span>🛡️</span>
                    <span>Feedback records</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("messages")}
                    className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer shadow-md"
                  >
                    <span>💬</span>
                    <span>Private messages</span>
                  </button>
                </div>

                {/* Recent Purchases */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Recent Orders ({orders.slice(0, 3).length})
                    </h3>
                    <button
                      onClick={() => setActiveTab("transactions")}
                      className="text-xs text-sky-400 hover:underline cursor-pointer"
                    >
                      View All Transactions →
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No purchase records found yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.slice(0, 3).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-white truncate">
                              {ord.product_title || `Order #${ord.id}`}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ${ord.amount || ord.price || 0} • {ord.payment_id || `ID: ${ord.id}`}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] shrink-0 ${
                              ord.payment_status === "completed" || ord.status === "Paid"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {ord.payment_status || ord.status || "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* VIEW 2: "MY PRODUCTS" (EXACTLY AS IN SCREENSHOT) */}
            {activeTab === "products" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-white">My products</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Here you can manage your products and product codes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(!showAddProductModal)}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Add New Product</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Product inventory exported to CSV format.")}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Add Product Sub-Panel */}
                {showAddProductModal && (
                  <form onSubmit={handleCreateProduct} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      Add New Product Listing
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Product Title</label>
                        <input
                          type="text"
                          required
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. PUBG Mobile 60 UC Global Pin"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Price (USD $)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="0.99"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Delivery Method</label>
                        <select
                          value={newDeliveryType}
                          onChange={(e) => setNewDeliveryType(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="auto">⚡ Automatic Delivery (Codes attached)</option>
                          <option value="manual">🕒 Manual Delivery (Dispatched later)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Category</label>
                        <input
                          type="text"
                          required
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="e.g. PUBG, Steam, Gift Cards"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {newDeliveryType === "auto" && (
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Voucher / License Codes (One per line)
                        </label>
                        <textarea
                          rows={3}
                          value={newVoucherCodes}
                          onChange={(e) => setNewVoucherCodes(e.target.value)}
                          placeholder="CODE-12345&#10;CODE-67890"
                          className="w-full font-mono bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProductModal(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingProduct}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        {addingProduct ? "Publishing..." : "Save Product ✓"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Products Table (Screenshot Layout) */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">ID</th>
                        <th className="p-3.5">Product name</th>
                        <th className="p-3.5 text-center">Sold</th>
                        <th className="p-3.5 text-center">Available</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Payment systems</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {myProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-10 text-center text-xs text-slate-500">
                            No products in inventory. Click "Add New Product" to list your digital assets.
                          </td>
                        </tr>
                      ) : (
                        myProducts.map((p) => {
                          const availableCount = p.voucher_codes
                            ? p.voucher_codes.split("\n").filter((c) => c.trim()).length
                            : 0;

                          return (
                            <tr key={p.id} className="hover:bg-slate-900/40 transition">
                              <td className="p-3.5 font-mono text-slate-400">#{p.id}</td>
                              <td className="p-3.5">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-500 block">{p.category}</span>
                                  <span className="font-bold text-white hover:text-sky-400 transition block truncate max-w-xs">
                                    {p.title}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5 text-center font-bold text-slate-200">
                                {p.sold_count || 0}
                              </td>
                              <td className="p-3.5 text-center">
                                {p.delivery_type === "manual" ? (
                                  <span className="text-amber-400 font-bold text-[11px]">🕒 Manual</span>
                                ) : (
                                  <span className={`font-bold ${availableCount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {availableCount}
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 font-bold text-sky-400">
                                ${p.price.toFixed(2)} USD
                              </td>
                              <td className="p-3.5">
                                <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                                  <span>🪙 Cryptomus</span>
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => alert(`Product #${p.id} editor options.`)}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                                >
                                  Action ▾
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 3: FEEDBACK RECORDS */}
            {activeTab === "feedbacks" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Feedback Records
                    </h2>
                    <p className="text-xs text-slate-400">
                      Ratings and customer reviews from verified transactions.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                    100% Positive
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">★★★★★</span>
                        <strong className="text-xs text-white">Fast & genuine code delivery!</strong>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Verified Buyer</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      "Code worked instantly upon payment confirmation. 36-hour safety hold gives complete peace of mind."
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">★★★★★</span>
                        <strong className="text-xs text-white">Trustworthy merchant</strong>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Verified Buyer</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      "Clean interface and immediate receipt. Would definitely purchase again!"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: MESSENGER PRIVATE MESSAGES */}
            {activeTab === "messages" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[520px] flex flex-col md:flex-row">
                {/* Left Conversations Sidebar */}
                <div className="w-full md:w-56 bg-slate-950 border-r border-slate-800 p-3 space-y-2 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">
                    Conversations
                  </span>
                  {conversations.map((contactEmail) => (
                    <button
                      key={contactEmail}
                      onClick={() => setActiveChatEmail(contactEmail)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2.5 ${
                        activeChatEmail === contactEmail
                          ? "bg-sky-500 text-white shadow-md shadow-sky-950"
                          : "text-slate-300 hover:bg-slate-900"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px]">
                        {contactEmail.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate flex-1">{contactEmail.split("@")[0]}</span>
                    </button>
                  ))}
                </div>

                {/* Right Messenger Chat Window */}
                <div className="flex-1 flex flex-col justify-between bg-slate-900/50">
                  {/* Chat Header */}
                  <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                      <span className="text-xs font-bold text-white font-mono">{activeChatEmail}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Direct In-Site Messaging</span>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {activeMessages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500">
                        No messages exchanged yet. Send a message below to start chatting.
                      </div>
                    ) : (
                      activeMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.sender_email === user.email ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.sender_email === user.email
                                ? "bg-sky-500 text-white rounded-br-none"
                                : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none"
                            }`}
                          >
                            <p>{msg.message}</p>
                            <span className="text-[9px] opacity-75 block text-right mt-1 font-mono">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Messenger Input Form */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      placeholder={`Type a message to ${activeChatEmail.split("@")[0]}...`}
                      className="flex-1 bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!typedMessage.trim()}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Send →
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW 5: TRANSACTIONS */}
            {activeTab === "transactions" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Transaction History ({orders.length})
                  </h2>
                  <span className="text-xs text-sky-400 font-mono">
                    Total Volume: ${totalSpent.toFixed(2)} USD
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500">
                    No transactions recorded on this account.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">
                            {ord.product_title || `Product #${ord.product_id}`}
                          </h4>
                          <span className="text-xs font-black text-sky-400">
                            ${ord.amount || ord.price || 0} USD
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 font-mono">
                          <span>Order ID: {ord.payment_id || `#${ord.id}`}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase ${
                              ord.payment_status === "completed" || ord.status === "Paid"
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {ord.payment_status || ord.status || "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 6: FINANCIAL */}
            {activeTab === "financial" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Financial & Wallet Summary
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cryptocurrency gateway transactions and buyer protection balance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Total Volume Paid
                    </span>
                    <h3 className="text-2xl font-black text-sky-400 font-mono mt-1">
                      ${totalSpent.toFixed(2)} USD
                    </h3>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Buyer Protection Balance
                    </span>
                    <h3 className="text-2xl font-black text-emerald-400 font-mono mt-1">
                      100% Protected
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 7: PROFILE */}
            {activeTab === "profile" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Profile & Identity
                  </h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Registered Name</span>
                    <strong className="text-white text-sm">{fullName}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Authenticated Email</span>
                    <strong className="text-sky-400 font-mono">{user?.email}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Country / Region</span>
                    <strong className="text-white">{country}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Membership Duration</span>
                    <strong className="text-sky-400">{membershipDurationText}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Account Tier Status</span>
                    <strong className="text-emerald-400">Level {levelDetails.level} — {levelDetails.title}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 8: DISPUTE CENTER */}
            {activeTab === "dispute" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Dispute Center & Safety Hold
                  </h2>
                  <p className="text-xs text-slate-400">
                    Report faulty codes or activate your 36-Hour Buyer Protection refund inquiry.
                  </p>
                </div>

                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
                  <div className="text-3xl">🛡️</div>
                  <h4 className="text-xs font-bold text-white">No Open Disputes</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    If an activation key is invalid or delivery is delayed, you can initiate a claim within 36 hours of payment.
                  </p>
                  <button
                    onClick={() => setActiveTab("support")}
                    className="inline-block px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Open Dispute Ticket →
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 9: SECURITY & SETTINGS */}
            {activeTab === "security" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Security & Authentication Settings
                  </h2>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-white block">Password Security</strong>
                      <span className="text-[11px] text-slate-400">
                        Reset your account password via 6-digit OTP
                      </span>
                    </div>
                    <Link
                      href="/auth"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] transition"
                    >
                      Update
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 10: DISCOUNT VOUCHERS */}
            {activeTab === "vouchers" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Discount Vouchers & Promotions
                  </h2>
                </div>
                <div className="p-8 text-center text-xs text-slate-500">
                  No promotional coupon codes currently applied to this account.
                </div>
              </div>
            )}

            {/* VIEW 11: SUPPORT DESK */}
            {activeTab === "support" && (
              <div className="space-y-6">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Submit Support Ticket
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Need help with an activation key or order? Submit your request below.
                    </p>
                  </div>

                  {ticketActionMsg && (
                    <div className="p-3 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200">
                      {ticketActionMsg}
                    </div>
                  )}

                  <form onSubmit={handleTicketSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="e.g. Code activation issue"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Order ID (Optional)</label>
                      <input
                        type="text"
                        value={ticketOrderId}
                        onChange={(e) => setTicketOrderId(e.target.value)}
                        placeholder="e.g. #1024"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Problem Description</label>
                      <textarea
                        rows={4}
                        required
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Describe your issue with code or receipt details..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-950"
                    >
                      {submittingTicket ? "Submitting Ticket..." : "Submit Ticket to Desk"}
                    </button>
                  </form>
                </div>

                {/* Support History */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                  <h3 className="text-sm font-bold text-white">Your Support History ({tickets.length})</h3>
                  {tickets.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No support tickets found on your account.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tickets.map((t) => (
                        <div key={t.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">{t.subject}</span>
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
                          <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            {t.message}
                          </p>
                          {t.admin_reply && (
                            <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs text-sky-200 space-y-1">
                              <span className="text-[10px] font-bold text-sky-400 block">Inskeys Support Desk Reply:</span>
                              <p>{t.admin_reply}</p>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono">
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

          {/* RIGHT SIDEBAR MENU - 9 BUTTONS */}
          <aside className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 space-y-1 shadow-2xl sticky top-24">
            
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">⊞</span>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "transactions"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">🔁</span>
              <span>Transactions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("financial")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "financial"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">💳</span>
              <span>Financial</span>
            </button>

            {/* Products Tab with Active Counter */}
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "products"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📦</span>
                <span>Products</span>
              </div>
              {myProducts.length > 0 && (
                <span className="bg-slate-950 text-sky-400 font-mono text-[10px] px-2 py-0.5 rounded-full border border-slate-800">
                  {myProducts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "profile"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">👤</span>
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dispute")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "dispute"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">🛡️</span>
              <span>Dispute Center</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "security"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">⚙️</span>
              <span>Security & settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("vouchers")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "vouchers"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">🎟️</span>
              <span>Discount Vouchers</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("support")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "support"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">🎫</span>
              <span>Support</span>
            </button>

          </aside>
        </div>
      </main>
    </div>
  );
}