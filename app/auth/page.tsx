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
                ? "Enter your details. A 6-digit security code will be sent to your email."
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