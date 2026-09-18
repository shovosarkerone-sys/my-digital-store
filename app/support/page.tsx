"use client";

import { useState } from "react";
import Link from "next/link";

export default function SupportPage() {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [sentNotice, setSentNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailto = `mailto:shovosarkerone@gmail.com?subject=${encodeURIComponent(
      `[Support Ticket] ${ticketSubject}`
    )}&body=${encodeURIComponent(ticketMessage)}`;
    window.location.href = mailto;
    setSentNotice(true);
  };

  const faqs = [
    {
      q: "How fast do I receive my purchased code?",
      a: "Orders marked as 'Official Store' are delivered automatically within seconds upon confirmed crypto payment. Community merchant orders are also fulfilled automatically from active inventory.",
    },
    {
      q: "What is the 24–36 hour escrow protection?",
      a: "When purchasing from community sellers, funds are placed on a security hold. Sellers only receive their payout after the dispute window expires or upon positive buyer validation.",
    },
    {
      q: "What happens if a voucher code is invalid?",
      a: "You can immediately open a dispute ticket through your dashboard or email support at shovosarkerone@gmail.com. We hold the seller's funds until the case is thoroughly reviewed.",
    },
    {
      q: "Why is external communication prohibited?",
      a: "To protect both parties from scam attempts and guarantee escrow coverage, exchanging emails, WhatsApp, or Telegram handles is strictly prohibited and subject to a $100 penalty.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* টপ বার */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md shadow-sky-500/20">
              S
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Shovo<span className="text-sky-400">Store</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
          >
            ← Storefront
          </Link>
        </div>

        {/* হেডার */}
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            ● Support Desk 24/7
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">How can we assist you?</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Need urgent assistance with an order, redemption, or dispute? Contact our official support desk directly.
          </p>
        </div>

        {/* অফিসিয়াল সাপোর্ট কন্টাক্ট কার্ড */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              Official Help Desk Email
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono selection:bg-sky-500">
              shovosarkerone@gmail.com
            </div>
            <p className="text-[11px] text-slate-400">
              Response SLA: Typically within 15–30 minutes during active trading hours.
            </p>
          </div>

          <a
            href="mailto:shovosarkerone@gmail.com?subject=Support%20Request%20-%20ShovoStore"
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-sky-950 cursor-pointer shrink-0"
          >
            Send Direct Email →
          </a>
        </div>

        {/* টিকেট / মেসেজ ফর্ম */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Submit Support Inquiry
          </h2>

          {sentNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
              Opening your default email client. You can also directly write to <strong>shovosarkerone@gmail.com</strong>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Order ID / Inquiry Subject
              </label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Order #10492 - Code activation inquiry"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Message & Issue Details
              </label>
              <textarea
                rows={4}
                required
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Please describe the issue, transaction hash, or question..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Draft Ticket to Support →
            </button>
          </form>
        </div>

        {/* সাধারণ জিজ্ঞাসা (FAQ) */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1.5"
              >
                <h4 className="text-xs font-bold text-slate-200">{f.q}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}