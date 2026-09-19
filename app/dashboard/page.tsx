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
  1: { level: 1, title: "Novice Buyer", badgeColor: "bg-slate-800 border-slate-700", textColor: "text-slate-300", icon: "🌱" },
  2: { level: 2, title: "Bronze Shopper", badgeColor: "bg-amber-900/20 border-amber-800/40", textColor: "text-amber-400", icon: "🥉" },
  3: { level: 3, title: "Silver Member", badgeColor: "bg-slate-700/30 border-slate-600/40", textColor: "text-slate-200", icon: "🥈" },
  4: { level: 4, title: "Gold Collector", badgeColor: "bg-yellow-500/10 border-yellow-500/30", textColor: "text-yellow-400", icon: "🥇" },
  5: { level: 5, title: "Platinum Client", badgeColor: "bg-cyan-500/10 border-cyan-500/30", textColor: "text-cyan-400", icon: "💠" },
  6: { level: 6, title: "Diamond VIP", badgeColor: "bg-sky-500/10 border-sky-500/30", textColor: "text-sky-400", icon: "💎" },
  7: { level: 7, title: "Master Customer", badgeColor: "bg-indigo-500/10 border-indigo-500/30", textColor: "text-indigo-400", icon: "🔮" },
  8: { level: 8, title: "Grandmaster", badgeColor: "bg-purple-500/10 border-purple-500/30", textColor: "text-purple-400", icon: "⚡" },
  9: { level: 9, title: "Elite Patron", badgeColor: "bg-rose-500/10 border-rose-500/30", textColor: "text-rose-400", icon: "🔥" },
  10: { level: 10, title: "Legendary Sovereign", badgeColor: "bg-amber-500/20 border-amber-400/50", textColor: "text-amber-300", icon: "👑" },
};

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "transactions" | "tickets">("profile");

  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketOrderId, setTicketOrderId] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketActionMsg, setTicketActionMsg] = useState("");

  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

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
        .eq("customer_email", user.email)
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

      setTicketActionMsg("✅ Ticket submitted successfully! Support staff will respond here.");
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
        Loading your account...
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || "Valued Customer";
  const country = user?.user_metadata?.country || "International";

  const rawLevel = user?.user_metadata?.buyer_level || (orders.length > 0 ? Math.min(orders.length + 1, 10) : 1);
  const currentBuyerLevel = Math.min(Math.max(Number(rawLevel) || 1, 1), 10);
  const levelDetails = BUYER_LEVELS[currentBuyerLevel];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition"
            >
              ← Back to Store
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {levelDetails.icon}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-white">{fullName}</h1>
                <div className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${levelDetails.badgeColor} ${levelDetails.textColor}`}>
                  <span>Level {levelDetails.level}</span>
                  <span className="text-[10px] opacity-75 font-normal">({levelDetails.title})</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{user.email}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Location: <span className="text-slate-300 font-semibold">{country}</span> • Orders: <span className="text-sky-400 font-semibold">{orders.length}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("tickets")}
              className="flex-1 sm:flex-none text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-sky-950 flex items-center justify-center gap-1.5"
            >
              <span>🎫</span>
              <span>Support Desk</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "profile"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👤 Account Profile
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "transactions"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📜 Purchase History ({orders.length})
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
        </div>

        {activeTab === "profile" && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Buyer Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Full Name</span>
                <span className="font-semibold text-white text-sm">{fullName}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Registered Email</span>
                <span className="font-semibold text-white text-sm font-mono">{user.email}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Country / Region</span>
                <span className="font-semibold text-white text-sm">{country}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Account Tier Status</span>
                <span className="font-semibold text-sky-400 text-sm">Level {levelDetails.level} — {levelDetails.title}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Order History</h2>
            {orders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
                No orders or transactions found yet. When you complete a purchase, it will appear here automatically.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Order #{ord.id}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold uppercase">
                          {ord.status || "Paid"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Product ID: {ord.product_id}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Date: {new Date(ord.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Amount Paid</span>
                      <span className="text-base font-black text-sky-400">${ord.amount || ord.price || 0} USD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Submit New Ticket</h3>
                <p className="text-xs text-slate-400 mt-0.5">Need help with an activation key or payment? Open a ticket below.</p>
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

            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-white px-1">Your Support History</h3>
              {tickets.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
                  <span className="text-3xl block">🎫</span>
                  <h4 className="text-xs font-semibold text-slate-300">No support tickets found</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Any inquiry you submit will appear here with real-time status and official support team replies.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickets.map((t) => (
                    <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
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
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        {t.message}
                      </p>
                      {t.admin_reply && (
                        <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-800/40 text-xs text-sky-200 space-y-1">
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
    </div>
  );
}