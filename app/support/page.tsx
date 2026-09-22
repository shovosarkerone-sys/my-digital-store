"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function SupportPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUser(user);
        setEmail(user.email || "");
        setName(user.user_metadata?.full_name || "");
      }
    }

    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSubmittedTicketId(null);

    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert([
          {
            user_id: currentUser?.id || null,
            user_name: name.trim() || (currentUser ? "Verified Member" : "Guest Customer"),
            user_email: email.trim(),
            role: currentUser ? "member" : "guest",
            subject: ticketSubject.trim(),
            message: ticketMessage.trim(),
            status: "open",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSubmittedTicketId(data?.id || 1);
      setTicketSubject("");
      setTicketMessage("");
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to dispatch your ticket. Please retry shortly.");
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "How fast do I receive my purchased code?",
      a: "Orders fulfilled by the Official Store or automated inventory appear on-screen instantly upon blockchain confirmation. Manual orders are dispatched directly by the verified merchant.",
    },
    {
      q: "How does the 36-Hour Buyer Protection guarantee work?",
      a: "Payment is retained securely in escrow for 36 hours. If an activation key is faulty or invalid, you are eligible for immediate replacement or full resolution before seller release.",
    },
    {
      q: "What should I do if a code shows 'Already Redeemed'?",
      a: "Open a ticket on this page or send a direct private message to the seller from your dashboard. Attach your order ID so our administration can inspect the key audit trail.",
    },
    {
      q: "Why is external communication outside Inskeys prohibited?",
      a: "To safeguard transactions against off-platform fraud and ensure 100% escrow dispute eligibility, all messaging and negotiations must remain inside Inskeys.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={32}
                height={32}
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && (
              <Link
                href="/dashboard?tab=support"
                className="text-xs text-sky-400 hover:text-white bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 rounded-xl transition font-medium"
              >
                My Support Desk →
              </Link>
            )}
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
            >
              ← Storefront
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>24/7 Concierge & Escrow Mediation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How can our desk assist you?
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Record your inquiry directly with the Inskeys customer safety team. Fast, audited, and cryptographic resolution.
          </p>
        </div>

        {/* Support Ticket Submission Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Submit Support Ticket
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Available for buyers, merchants, and registered members.
              </p>
            </div>
            <span className="text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-lg">
              {currentUser ? "Authenticated Member" : "Guest Client"}
            </span>
          </div>

          {submittedTicketId && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl space-y-1.5 relative z-10 animate-in fade-in">
              <span className="font-bold text-sm block">✓ Inquiry Dispatched to Support Desk!</span>
              <p className="leading-relaxed">
                Your Tracking Reference is <strong className="font-mono text-white">#{submittedTicketId}</strong>. A concierge agent has been assigned to mediate your case.
              </p>
              {currentUser && (
                <Link
                  href="/dashboard?tab=support"
                  className="inline-block mt-1 text-sky-400 font-bold hover:underline"
                >
                  View Live Response in Dashboard Support Tab →
                </Link>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl relative z-10">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address for Updates
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition shadow-inner font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Subject / Order Identifier
              </label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Order #10492 - Code activation inquiry"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Message & Issue Details
              </label>
              <textarea
                rows={5}
                required
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your issue with voucher code, payment reference, or redemption error..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition shadow-inner"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-950 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Encrypting & Dispatching Ticket...</span>
                  </>
                ) : (
                  <span>Submit Ticket to Concierge →</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* FAQ Knowledge Base */}
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