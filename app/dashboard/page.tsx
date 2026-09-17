"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "transactions" | "ticket">("profile");

  // টিকিট ফর্মের স্টেট
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketOrderId, setTicketOrderId] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  // অর্ডার হিস্ট্রি
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      // বায়ারের আগের অর্ডার/ট্রানজ্যাকশন ফেচ করা
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", user.email)
        .order("id", { ascending: false });

      if (orderData) {
        setOrders(orderData);
      }

      setLoading(false);
    }
    loadUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // হোয়াটসঅ্যাপ টিকিট সাবমিট
  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const adminWhatsApp = "8801797362397";
    const formattedMessage = encodeURIComponent(
      `🎫 *NEW SUPPORT TICKET*\n\n` +
      `👤 *Buyer Name:* ${user?.user_metadata?.full_name || "N/A"}\n` +
      `📧 *Email:* ${user?.email}\n` +
      `🌍 *Country:* ${user?.user_metadata?.country || "N/A"}\n` +
      `🆔 *Order ID:* ${ticketOrderId || "N/A"}\n` +
      `📌 *Subject:* ${ticketSubject}\n\n` +
      `📝 *Problem Description:*\n${ticketMessage}`
    );

    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${formattedMessage}`;
    window.open(whatsappUrl, "_blank");

    // ফর্ম ক্লিয়ার
    setTicketSubject("");
    setTicketOrderId("");
    setTicketMessage("");
    alert("Opening WhatsApp with your ticket details!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-400 font-mono text-sm">
        Loading your account...
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || "Valued Buyer";
  const country = user?.user_metadata?.country || "International";

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* টপ ন্যাভ ও লোগো */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-sky-500/20">
              S
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Shovo<span className="text-sky-400">Store</span>
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

        {/* বায়ার প্রোফাইল কার্ড */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-sky-500/20">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{fullName}</h1>
                <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-medium">
                  Verified Buyer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{user.email}</p>
              <p className="text-xs text-slate-500 mt-0.5">Location: <span className="text-slate-300 font-semibold">{country}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("ticket")}
              className="flex-1 sm:flex-none text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-sky-950"
            >
              💬 Create Ticket
            </button>
          </div>
        </div>

        {/* ট্যাব সুইচ নেভিগেশন */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "profile"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👤 Account Details
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "transactions"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📜 Transactions / Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("ticket")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === "ticket"
                ? "bg-slate-800 text-sky-400 border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🎫 Support Ticket (WhatsApp)
          </button>
        </div>

        {/* ট্যাব ১: একাউন্ট ডিটেইলস */}
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
                <span className="text-slate-500 block mb-1">Member Since</span>
                <span className="font-semibold text-white text-sm">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ট্যাব ২: ট্রানজ্যাকশন / অর্ডার হিস্ট্রি */}
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

        {/* ট্যাব ৩: ক্রিয়েট টিকিট (সরাসরি হোয়াটসঅ্যাপ) */}
        {activeTab === "ticket" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                💬 Instant WhatsApp Support
              </div>
              <h2 className="text-xl font-bold text-white">Create Support Ticket</h2>
              <p className="text-xs text-slate-400 mt-1">
                Describe your issue below. Submitting will immediately open a direct WhatsApp chat with our store admin with your ticket details.
              </p>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ticket Subject / Reason
                </label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Issue with License Activation / Payment query"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Order ID (Optional)
                </label>
                <input
                  type="text"
                  value={ticketOrderId}
                  onChange={(e) => setTicketOrderId(e.target.value)}
                  placeholder="e.g. #1024 (Leave blank if general question)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Problem Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Write your issue in detail here..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>💬 Submit Ticket via WhatsApp</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}