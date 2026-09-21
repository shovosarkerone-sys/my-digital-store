"use client";

import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
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
  "Oman",
  "Australia",
  "Germany",
  "Italy",
  "Singapore",
  "Other",
];

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Continue with Google অথেন্টিকেশন হ্যান্ডলার
  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${redirectUrl}`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to continue with Google.");
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              country: country,
            },
          },
        });

        if (error) throw error;

        setShowOtpScreen(true);
        setSuccessMsg("Verification code sent to your email!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: "signup",
      });

      if (error) throw error;

      setSuccessMsg("Account verified successfully! Redirecting...");
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
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
        <Link href="/" className="text-xs text-slate-400 hover:text-white transition">
          ← Home
        </Link>
      </div>

      {showOtpScreen ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center space-y-2">
            <span className="text-3xl">📩</span>
            <h2 className="text-lg font-black text-white">Enter 6-Digit Code</h2>
            <p className="text-xs text-slate-400">
              Check your inbox at <span className="text-sky-400 font-mono">{email}</span>
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {successMsg}
            </div>
          )}

          <div>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-[10px] text-2xl font-mono bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl py-3 text-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-sky-950 cursor-pointer"
          >
            {loading ? "Verifying Code..." : "Confirm & Continue"}
          </button>

          <button
            type="button"
            onClick={() => setShowOtpScreen(false)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1 cursor-pointer"
          >
            ← Back to Sign Up
          </button>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer ${
                !isSignUp
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer ${
                isSignUp
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <div>
            <h1 className="text-xl font-black text-white">
              {isSignUp ? "Create Verified Account" : "Welcome Back"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isSignUp
                ? "Enter your details or continue with your Google account."
                : "Sign in to access your buyer or seller panel."}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {successMsg}
            </div>
          )}

          {/* Continue with Google বাটন */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 hover:border-slate-700 border border-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-3 cursor-pointer shadow-sm"
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
            <span>Continue with Google</span>
          </button>

          {/* মার্জিত ডিভাইডার */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-800"></div>
            <span className="bg-slate-900 px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase absolute">
              or
            </span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Country
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
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 chars)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-sky-950 cursor-pointer"
            >
              {loading
                ? "Processing..."
                : isSignUp
                ? "Send 6-Digit Code"
                : "Sign In"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
      <Suspense fallback={<div className="text-sky-400 font-mono text-sm">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}