"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
        // রিডাইরেক্ট না করে ইউজারকে এখানেই গুগল দিয়ে সাইন ইন করার সুযোগ দেওয়া হলো
        setLoading(false);
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

  // সরাসরি গুগল সাইনআপ হ্যান্ডলার
  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/become-seller`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to continue with Google.");
      setSubmitting(false);
    }
  };

  const handleRegisterSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMsg(
        "Please review and agree to the Merchant Operating Terms before continuing."
      );
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
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
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
            {user
              ? "Create your merchant profile to list digital vouchers, license keys, and game assets across the platform."
              : "Sign in with your Google account to start selling digital products and license keys."}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* ইউজার লগইন না করা থাকলে সরাসরি Continue with Google স্ক্রিন */}
        {!user ? (
          <div className="space-y-5 py-2">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center space-y-3">
              <div className="text-3xl">🔐</div>
              <h3 className="text-sm font-bold text-slate-200">
                Merchant Authentication Required
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                To protect marketplace integrity and manage escrow payouts,
                merchants must verify their identity.
              </p>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-850 hover:border-slate-700 border border-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-3 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{submitting ? "Redirecting..." : "Continue with Google"}</span>
            </button>

            <div className="text-center">
              <Link
                href="/auth?redirect=/become-seller"
                className="text-xs text-slate-500 hover:text-sky-400 transition"
              >
                Prefer using email & password? Click here
              </Link>
            </div>
          </div>
        ) : (
          /* ইউজার লগইন করা থাকলে মূল মার্চেন্ট ফর্ম */
          <form onSubmit={handleRegisterSeller} className="space-y-5">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Authenticated as:</span>
              <span className="text-sky-400 font-mono font-semibold">
                {user.email}
              </span>
            </div>

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
                Store Description{" "}
                <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief overview of the products or licenses you offer..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>

            {/* মার্চেন্ট কমপ্লায়েন্স ও এগ্রিমেন্ট কার্ড */}
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
                    <strong className="text-slate-200">Escrow Security:</strong>{" "}
                    All sales funds remain held in escrow for 24–36 hours
                    post-fulfillment to safeguard buyer validity and prevent
                    chargebacks.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-0.5">•</span>
                  <span>
                    <strong className="text-slate-200">Platform Integrity:</strong>{" "}
                    All buyer communications and fulfillment must remain
                    strictly within the Inskeys platform.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-0.5">•</span>
                  <span>
                    <strong className="text-slate-200">
                      Anti-Circumvention Policy:
                    </strong>{" "}
                    Exchanging direct contact information (Email, Telegram,
                    WhatsApp) or soliciting off-platform payments will result in
                    a{" "}
                    <strong className="text-rose-400 font-medium">
                      $100 compliance penalty
                    </strong>{" "}
                    or immediate account termination.
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
                    I acknowledge and agree to comply with the Merchant Terms,
                    Escrow Policy, and Platform Security Guidelines.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-sky-950/40 cursor-pointer"
            >
              {submitting
                ? "Submitting Application..."
                : "Complete Merchant Registration"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}