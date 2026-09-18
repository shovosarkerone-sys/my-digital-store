"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const COUNTRIES = [
  "Bangladesh",
  "India",
  "Pakistan",
  "United States",
  "United Kingdom",
  "Saudi Arabia",
  "United Arab Emirates",
  "Canada",
  "Malaysia",
  "Kuwait",
  "Qatar",
  "Australia",
  "Germany",
  "Singapore",
  "Other",
];

export default function BecomeSellerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [shopName, setShopName] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [description, setDescription] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function checkAuthAndSeller() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth?redirect=/become-seller");
        return;
      }

      setUser(user);

      const { data: existingSeller } = await supabase
        .from("sellers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (existingSeller) {
        router.push("/seller-dashboard");
        return;
      }

      if (user.user_metadata?.country) {
        setCountry(user.user_metadata.country);
      }

      setLoading(false);
    }

    checkAuthAndSeller();
  }, [router]);

  const handleRegisterSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMsg("Please review and agree to the Merchant Operating Terms before continuing.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.from("sellers").insert([
        {
          id: user.id,
          shop_name: shopName.trim(),
          country: country,
          description: description.trim(),
          seller_level: "Level 1 Verified Merchant",
        },
      ]);

      if (error) throw error;

      router.push("/seller-dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register merchant account.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans text-sm">
        Verifying account status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* ব্র্যান্ড হেডার */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-sm text-white">
              S
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Shovo<span className="text-sky-400">Store</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white transition font-medium"
          >
            ← Buyer Account
          </Link>
        </div>

        {/* হেডার টেক্সট */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Merchant Onboarding
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Register as a Merchant
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Create your merchant profile to list digital vouchers, license keys, and game assets across the platform.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegisterSeller} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Store / Brand Name
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Apex Codes, Global Voucher Store"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Operating Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Store Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief overview of the products or licenses you offer..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          {/* প্রফেশনাল মার্চেন্ট কমপ্লায়েন্স ও এগ্রিমেন্ট কার্ড */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 border-b border-slate-800/80 pb-2.5">
              <svg
                className="w-4 h-4 text-sky-400 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Merchant Code of Conduct & Escrow Terms</span>
            </div>

            <ul className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-slate-600 mt-0.5">•</span>
                <span>
                  <strong className="text-slate-200">Escrow Security:</strong> All sales funds remain held in escrow for 24–36 hours post-fulfillment to safeguard buyer validity and prevent chargebacks.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-600 mt-0.5">•</span>
                <span>
                  <strong className="text-slate-200">Platform Integrity:</strong> All buyer communications and fulfillment must remain strictly within the ShovoStore platform.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-600 mt-0.5">•</span>
                <span>
                  <strong className="text-slate-200">Anti-Circumvention Policy:</strong> Exchanging direct contact information (Email, Telegram, WhatsApp) or soliciting off-platform payments will result in a <strong className="text-rose-400 font-medium">$100 compliance penalty</strong> or immediate account termination.
                </span>
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500/30 cursor-pointer"
                />
                <span className="text-xs text-slate-300 group-hover:text-white transition leading-snug">
                  I acknowledge and agree to comply with the Merchant Terms, Escrow Policy, and Platform Security Guidelines.
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-sky-950/40 cursor-pointer"
          >
            {submitting ? "Submitting Application..." : "Complete Merchant Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}