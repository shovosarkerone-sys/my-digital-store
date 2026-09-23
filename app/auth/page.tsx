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

  // Views: "login" | "signup" | "verify_signup" | "forgot_request" | "forgot_verify"
  const [authView, setAuthView] = useState<
    "login" | "signup" | "verify_signup" | "forgot_request" | "forgot_verify"
  >("login");

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
      if (authView === "signup") {
        const { error } = await supabase.auth.signUp({
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

        setAuthView("verify_signup");
        setSuccessMsg("Verification code sent to your email!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
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

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.verifyOtp({
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

  // Password Reset: Request 6-digit OTP
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please provide your registered email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;

      setAuthView("forgot_verify");
      setSuccessMsg("A 6-digit password reset code has been dispatched to your email.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Password Reset: Confirm 6-digit OTP & update password
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Verify recovery OTP
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "recovery",
      });

      if (otpError) throw otpError;

      // 2. Set new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccessMsg("Password updated successfully! Logging you in...");
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-6 transition-colors duration-200">
      {/* Header with Transparent Logo */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="shrink-0">
            <Image
              src="/icon.png"
              alt="Inskeys"
              width={34}
              height={34}
              className="w-8 h-8 object-contain bg-transparent"
            />
          </div>
          <span className="font-black text-base tracking-tight text-slate-900 dark:text-white">
            Inskeys
          </span>
        </Link>
        <Link href="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
          ← Home
        </Link>
      </div>

      {/* VIEW 1: SIGNUP EMAIL OTP VERIFICATION */}
      {authView === "verify_signup" && (
        <form onSubmit={handleVerifySignupOtp} className="space-y-4">
          <div className="text-center space-y-2">
            <span className="text-3xl">📩</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Enter 6-Digit Code</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check your inbox at <span className="text-sky-600 dark:text-sky-400 font-mono font-bold">{email}</span>
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
              className="w-full text-center tracking-[10px] text-2xl font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-500/20 cursor-pointer"
          >
            {loading ? "Verifying Code..." : "Confirm & Continue"}
          </button>

          <button
            type="button"
            onClick={() => setAuthView("signup")}
            className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1 cursor-pointer"
          >
            ← Back to Sign Up
          </button>
        </form>
      )}

      {/* VIEW 2: FORGOT PASSWORD - REQUEST OTP */}
      {authView === "forgot_request" && (
        <form onSubmit={handleRequestPasswordReset} className="space-y-4">
          <div className="text-center space-y-2">
            <span className="text-3xl">🔑</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Reset Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your registered email address to receive a 6-digit recovery code.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Registered Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-500/20 cursor-pointer"
          >
            {loading ? "Sending Code..." : "Send 6-Digit Reset Code"}
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMsg("");
              setSuccessMsg("");
              setAuthView("login");
            }}
            className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1 cursor-pointer"
          >
            ← Back to Log In
          </button>
        </form>
      )}

      {/* VIEW 3: FORGOT PASSWORD - CONFIRM OTP & SET NEW PASSWORD */}
      {authView === "forgot_verify" && (
        <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
          <div className="text-center space-y-2">
            <span className="text-3xl">🛡️</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Set New Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the 6-digit code sent to <strong className="text-sky-600 dark:text-sky-400">{email}</strong> and your new password.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
              6-Digit Recovery Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-[10px] text-2xl font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="•••••••• (Min 6 chars)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            {loading ? "Updating Password..." : "Update Password & Log In"}
          </button>

          <button
            type="button"
            onClick={() => setAuthView("forgot_request")}
            className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1 cursor-pointer"
          >
            ← Resend Code / Change Email
          </button>
        </form>
      )}

      {/* VIEW 4 & 5: MAIN LOGIN & SIGNUP FORMS */}
      {(authView === "login" || authView === "signup") && (
        <>
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthView("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer ${
                authView === "login"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthView("signup");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2.5 rounded-xl transition cursor-pointer ${
                authView === "signup"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {authView === "signup" ? "Create Verified Account" : "Welcome Back"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {authView === "signup"
                ? "Enter your details or continue with your Google account."
                : "Sign in to access your buyer or seller panel."}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {successMsg}
            </div>
          )}

          {/* Google Auth Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 border border-slate-200 dark:border-slate-800 disabled:opacity-50 text-slate-800 dark:text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-3 cursor-pointer shadow-sm"
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

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase absolute">
              or
            </span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authView === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {authView === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg("");
                      setSuccessMsg("");
                      setAuthView("forgot_request");
                    }}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 chars)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-500/20 cursor-pointer"
            >
              {loading
                ? "Processing..."
                : authView === "signup"
                ? "Send 6-Digit Code"
                : "Log In"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 selection:bg-sky-500 selection:text-white transition-colors duration-200">
      <Suspense fallback={<div className="text-sky-500 dark:text-sky-400 font-mono text-sm">Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}