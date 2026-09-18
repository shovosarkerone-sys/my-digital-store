"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* টপ হেডার */}
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
            ← Back to Storefront
          </Link>
        </div>

        {/* ব্যানার */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            About Our Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            Next-Gen Digital Asset & Voucher Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Empowering gamers, creators, and digital traders worldwide with instant crypto fulfillment and rigorous escrow protection.
          </p>
        </div>

        {/* মূল ৩টি স্তম্ভ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-2.5">
            <span className="text-2xl">⚡</span>
            <h3 className="text-sm font-bold text-white">Instant Fulfillment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All digital activation codes and gift cards from our Official Store are delivered instantaneously upon blockchain payment verification.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-2.5">
            <span className="text-2xl">🛡️</span>
            <h3 className="text-sm font-bold text-white">24–36h Escrow Shield</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Community seller funds are safely locked in our automated escrow hold until buyers verify code validity, preventing fraudulent activities.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-2.5">
            <span className="text-2xl">🔒</span>
            <h3 className="text-sm font-bold text-white">Anti-Circumvention</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero off-platform communication policy backed by strict compliance rules to keep every transaction safe and trackable on-chain.
            </p>
          </div>
        </div>

        {/* কোম্পানি ডিটেইলস */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-white">Our Vision</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            ShovoStore was engineered to replace clunky, high-fee traditional marketplaces with a minimalist, high-speed ecosystem. By combining our direct Official Store stock with an open P2P marketplace, buyers obtain competitive pricing while enjoying institutional-grade security.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
            <Link href="/support" className="text-sky-400 hover:text-sky-300">
              Need Help? Visit Support →
            </Link>
            <Link href="/become-seller" className="text-amber-400 hover:text-amber-300">
              Want to Sell? Join as Merchant →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}