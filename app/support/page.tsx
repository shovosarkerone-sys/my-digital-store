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
            user_name: name.trim() || (currentUser ? "Verified User" : "Guest"),
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
      setErrorMsg(err.message || "Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "How fast do I receive my purchased code?",
      a: "Orders marked as 'Official Store' are delivered automatically within seconds upon confirmed payment. Community merchant orders are also fulfilled automatically from active inventory.",
    },
    {
      q: "What is the 24–36 hour escrow protection?",
      a: "When purchasing from community sellers, funds are placed on a security hold. Sellers only receive their payout after the dispute window expires or upon positive buyer validation.",
    },
    {
      q: "What happens if a voucher code is invalid?",
      a: "You can immediately open a support ticket right here on this page or from your dashboard. We hold the seller's funds until the case is investigated and resolved.",
    },
    {
      q: "Why is external communication prohibited?",
      a: "To protect both parties from fraud and guarantee escrow coverage, exchanging off-platform contacts is strictly prohibited.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
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
            <span className="font-bold text-base tracking-tight text-white">
              Inskeys
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
          >
            ← Storefront
          </Link>
        </div>

        <div className="space-y-2 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            ● In-Site Support Desk 24/7
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">How can we assist you?</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Submit a support ticket below. Your inquiry is recorded directly into our system for fast administrative resolution.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Create Support Ticket
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Available for registered buyers, merchant sellers, and guests.
              </p>
            </div>
            <span className="text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-lg">
              {currentUser ? "Logged In User" : "Guest Mode"}
            </span>
          </div>

          {submittedTicketId && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-2xl space-y-1">
              <span className="font-bold text-sm block">Ticket Created Successfully!</span>
              <p>
                Your Ticket ID is <strong>#{submittedTicketId}</strong>. Our support team will review your case and resolve it directly on the platform.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address for Updates
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subject / Order ID
              </label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Order #10492 - Code activation error"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Message & Issue Details
              </label>
              <textarea
                rows={5}
                required
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Explain what happened with order code, transaction hash, or account..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-950"
            >
              {submitting ? "Submitting Ticket..." : "Submit Ticket to Website →"}
            </button>
          </form>
        </div>

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