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

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  >("dashboard");

  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .or(`user_email.eq.${user.email},customer_email.eq.${user.email}`)
        .order("id", { ascending: false });

      if (orderData) {
        setOrders(orderData);
      }

      await loadUserTickets(user.email, user.id);
      setLoading(false);
    }

    loadUserData();
  }, [router]);

  const loadUserTickets = async (userEmail?: string, userId?: string) => {
    if (!userEmail && !userId) return;

    let query = supabase.from("support_tickets").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (userEmail) {
      query = query.eq("user_email", userEmail);
    }

    const { data: ticketData } = await query.order("created_at", { ascending: false });
    if (ticketData) {
      setTickets(ticketData);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
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
          
          {/* LEFT & CENTER CONTENT (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* VIEW 1: MAIN DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* User Profile Card */}
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

                    {/* Metadata Specs */}
                    <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80 font-medium">
                      <div className="flex justify-between">
                        <span>Registered:</span>
                        <strong className="text-slate-200 font-mono">{registeredDate}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Successful transactions:</span>
                        <strong className="text-sky-400 font-bold">{completedOrders.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tier status:</span>
                        <strong className="text-slate-200">{levelDetails.title}</strong>
                      </div>
                    </div>
                  </div>

                  {/* System Messages & Notifications */}
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
                    onClick={() => setActiveTab("dispute")}
                    className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer shadow-md"
                  >
                    <span>🛡️</span>
                    <span>Feedback records</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("support")}
                    className="p-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer shadow-md"
                  >
                    <span>💬</span>
                    <span>Private messages</span>
                  </button>
                </div>

                {/* Recent Purchases Quick Showcase */}
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

            {/* VIEW 2: TRANSACTIONS */}
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

            {/* VIEW 3: PRODUCTS & KEYS */}
            {activeTab === "products" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Purchased Licenses & Codes
                  </h2>
                  <p className="text-xs text-slate-400">
                    Access and copy your digital vouchers and license activations.
                  </p>
                </div>

                {completedOrders.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500">
                    No active digital codes found. Completed orders will appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {ord.product_title || `Order #${ord.id}`}
                          </span>
                          <span className="text-[10px] text-sky-400 font-bold uppercase bg-sky-500/10 px-2 py-0.5 rounded">
                            {ord.delivery_type === "manual" ? "🕒 Manual" : "⚡ Auto"}
                          </span>
                        </div>

                        {ord.delivery_content && (
                          <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs">
                            <span className="truncate pr-2 text-emerald-400">
                              {ord.delivery_content}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(ord.delivery_content!)}
                              className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer"
                            >
                              {copiedKey === ord.delivery_content ? "Copied! ✓" : "Copy Key"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: FINANCIAL */}
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

            {/* VIEW 5: PROFILE */}
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
                    <span className="text-slate-400 block text-[10px]">Account Tier Status</span>
                    <strong className="text-emerald-400">Level {levelDetails.level} — {levelDetails.title}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 6: DISPUTE CENTER */}
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

            {/* VIEW 7: SECURITY & SETTINGS */}
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

            {/* VIEW 8: DISCOUNT VOUCHERS */}
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

            {/* VIEW 9: SUPPORT & TICKETS */}
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

          {/* RIGHT SIDEBAR MENU - 9 EXACT BUTTONS AS IN SCREENSHOT */}
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

            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === "products"
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base">📦</span>
              <span>Products</span>
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