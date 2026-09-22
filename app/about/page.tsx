"use client";

import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  const stats = [
    { label: "Orders Delivered", value: "10,000+", change: "+99.8% Success Rate" },
    { label: "Buyer Protection", value: "100%", change: "36-Hour Safety Hold" },
    { label: "Catalog Products", value: "500+", change: "Growing Daily" },
    { label: "Registered Traders", value: "5,000+", change: "Worldwide Users" },
  ];

  const coreServices = [
    {
      icon: "🎮",
      title: "Games & Software Licenses",
      desc: "Instant and budget-friendly access to genuine game keys, OS licenses, DLCs, and software from verified merchants.",
    },
    {
      icon: "🎁",
      title: "Gift Cards & Vouchers",
      desc: "Buy international digital gift vouchers for Steam, PlayStation, Xbox, Apple, and premium online entertainment services.",
    },
    {
      icon: "⚡",
      title: "Subscriptions & Top-Ups",
      desc: "Top up your favorite gaming wallets, Discord Nitro, and digital platforms seamlessly using flexible crypto checkout.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="Inskeys"
              width={34}
              height={34}
              className="w-8 h-8 object-contain bg-transparent"
            />
            <span className="font-extrabold text-lg tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="https://www.trustpilot.com/review/inskeys.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition"
            >
              <span>★</span> Trustpilot
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        {/* 1. Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold text-sky-400 tracking-widest uppercase bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 rounded-full inline-block">
            About Inskeys Marketplace
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Your Premier Destination for Digital Entertainment
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            No matter your platform—PC, console, or mobile—Inskeys connects verified sellers and global buyers with unbeatable prices, secure crypto payments, and guaranteed 36-Hour Buyer Protection.
          </p>

          <div className="flex items-center justify-center gap-3 pt-3">
            <Link
              href="/"
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-950 transition"
            >
              Explore Products →
            </Link>
            <Link
              href="/#contact"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              Contact Support
            </Link>
          </div>
        </section>

        {/* 2. Core Service Pillars */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white">What We Offer</h2>
            <p className="text-xs text-slate-400">Everything you need for gaming, software, and subscriptions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coreServices.map((service, index) => (
              <div
                key={index}
                className="p-6 bg-slate-900/70 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl">
                  {service.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{service.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Who We Are & Dual Ecosystem (Buyers vs Sellers) */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Who We Are</span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              A Transparent, High-Speed Marketplace Built for Everyone
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Inskeys was founded to eliminate excessive middleman commissions and payment hurdles in digital trading. Whether you are buying games or managing a high-volume merchant store, we provide an automated, dispute-free environment backed by strict buyer safety standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* For Buyers */}
            <div className="p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">For Buyers</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                <li>• <strong>36-Hour Buyer Protection:</strong> Funds are securely held for 36 hours until you verify and activate your code.</li>
                <li>• <strong>Instant & Flexible:</strong> Immediate automated delivery or transparent manual order fulfillment.</li>
                <li>• <strong>Direct Crypto Checkout:</strong> Pay instantly with your preferred crypto with low network fees.</li>
              </ul>
            </div>

            {/* For Sellers */}
            <div className="p-5 bg-slate-950 border border-slate-800/90 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">💼</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">For Sellers</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                <li>• <strong>Minimal Marketplace Fees:</strong> Keep the highest portion of your hard-earned revenue.</li>
                <li>• <strong>Instant Global Audience:</strong> Sell to international customers without regional limitations.</li>
                <li>• <strong>Dedicated Seller Dashboard:</strong> Manage stock, track analytics, and handle customer queries seamlessly.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Marketplace In Numbers (Stats Grid) */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">Platform Integrity</span>
            <h2 className="text-xl font-bold text-white">Inskeys by the Numbers</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((st, i) => (
              <div
                key={i}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1"
              >
                <div className="text-2xl font-black text-sky-400 font-mono">
                  {st.value}
                </div>
                <div className="text-xs font-bold text-white">{st.label}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{st.change}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Company Info & Verification Details */}
        <section className="border-t border-slate-800/80 pt-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white">Inskeys Operations & Support</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Dedicated to safe digital goods exchange, fast resolution disputes, and 24/7 client security.
              </p>
              <div className="text-[11px] text-slate-500 font-mono pt-1">
                Official Support: <strong className="text-sky-400">contact@inskeys.com</strong> • Domain: inskeys.com
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Home
              </Link>
              <Link
                href="https://www.trustpilot.com/review/inskeys.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition"
              >
                Trustpilot Reviews ★
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Inskeys.com. All Rights Reserved. All product names, logos, and brands are property of their respective owners.</p>
      </footer>
    </div>
  );
}