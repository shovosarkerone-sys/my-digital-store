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
      const { data: { user } } = await supabase.auth.getUser();

      // যদি লগইন না থাকে, তবে অথ পেজে পাঠাবে এবং লগইন শেষে আবার এই পেজে নিয়ে আসবে
      if (!user) {
        router.push("/auth?redirect=/become-seller");
        return;
      }

      setUser(user);

      // অলরেডি সেলার কি না চেক করা
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
      setErrorMsg("You must agree to the platform security terms.");
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
          seller_level: "Level 1 (Verified Seller)",
        },
      ]);

      if (error) throw error;

      router.push("/seller-dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register as seller.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-400 font-mono text-sm">
        Checking verification status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* লোগো ও ব্যাক লিংক */}
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
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-white transition"
          >
            ← Buyer Dashboard
          </Link>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-2">
            🚀 Seller Onboarding
          </div>
          <h1 className="text-2xl font-black text-white">Open Your Digital Shop</h1>
          <p className="text-xs text-slate-400 mt-1">
            Start listing activation keys, gift cards, and game assets to thousands of buyers worldwide.
          </p>
        </div>

        {/* কঠোর সতর্কবার্তা নোটিশ */}
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <span>⚠️ STRICT PLATFORM ESCROW POLICY</span>
          </div>
          <p className="text-[11px] text-rose-200/80 leading-relaxed">
            Sharing personal contact info (WhatsApp, Telegram, Email) or requesting payments outside the website is strictly forbidden. 
            <strong className="text-white"> Violations will cause an instant $100 penalty or permanent account ban.</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegisterSeller} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Shop / Brand Name
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Apex Codes, VoucherHub BD"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Short Description / Bio (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers what kind of digital products or licenses you provide..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="agreeTerms" className="text-xs text-slate-400 cursor-pointer">
              I agree to the 24–36h escrow hold policy and promise never to share external contact information with buyers.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-sky-950 cursor-pointer"
          >
            {submitting ? "Activating Seller Status..." : "Activate Seller Account & Enter Dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}