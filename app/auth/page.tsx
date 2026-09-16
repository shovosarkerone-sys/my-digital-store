"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthMode =
  | "login"
  | "signup"
  | "check_email"
  | "forgot_password"
  | "reset_password";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // বর্তমান ইউজার সেশন চেক করা
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUser(data.user);
    });

    // ইমেইল লিংকে ক্লিক করে পাসওয়ার্ড রিসেট পেজে এলে স্বয়ংক্রিয়ভাবে ডিটেক্ট করা
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setMode("reset_password");
        } else if (event === "SIGNED_IN" && session?.user) {
          setCurrentUser(session.user);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const showMsg = (text: string, isError: boolean = false) => {
    setStatus({ text, isError });
  };

  // ১. সাইন আপ (ইমেইলে কনফার্মেশন লিংক পাঠানো হবে)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showMsg("Please fill in all fields", true);
      return;
    }

    setLoading(true);
    setStatus(null);

    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);

    if (error) {
      showMsg(error.message, true);
    } else {
      setMode("check_email");
    }
  };

  // ২. পাসওয়ার্ড দিয়ে লগইন
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showMsg("Please enter both email and password", true);
      return;
    }

    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    setLoading(false);

    if (error) {
      showMsg(error.message, true);
    } else {
      showMsg("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    }
  };

  // ৩. পাসওয়ার্ড রিসেট লিংক রিকোয়েস্ট
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showMsg("Please enter your registered email", true);
      return;
    }

    setLoading(true);
    setStatus(null);

    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    setLoading(false);

    if (error) {
      showMsg(error.message, true);
    } else {
      showMsg("Password reset link sent! Check your email inbox to proceed.");
    }
  };

  // ৪. ইমেইল লিংকে ক্লিক করার পর নতুন পাসওয়ার্ড সংরক্ষণ
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 6) {
      showMsg("Password must be at least 6 characters", true);
      return;
    }

    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      showMsg(error.message, true);
    } else {
      showMsg("Password updated successfully! Redirecting...");
      setTimeout(() => {
        setMode("login");
        setNewPassword("");
        router.push("/");
      }, 1500);
    }
  };

  // লগআউট
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    showMsg("Logged out successfully");
  };

  // ইউজার আগে থেকেই লগইন থাকলে প্রোফাইল কার্ড
  if (currentUser && mode !== "reset_password") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            👤
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              {currentUser.user_metadata?.full_name || "Valued Customer"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">{currentUser.email}</p>
          </div>
          <div className="pt-4 border-t border-slate-800 flex gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition"
            >
              Back to Store
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-black text-sky-400 tracking-tight">
            ShovoStore.
          </Link>
          <p className="text-xs font-semibold text-slate-400 mt-1.5">
            {mode === "login" && "Sign in to access your digital orders & assets"}
            {mode === "signup" && "Create your account with secure email verification"}
            {mode === "check_email" && "Check your inbox to verify your email"}
            {mode === "forgot_password" && "Reset your password via verified email link"}
            {mode === "reset_password" && "Set a new secure password for your account"}
          </p>
        </div>

        {/* Status Notification */}
        {status && (
          <div
            className={`text-xs p-3 rounded-xl font-bold mb-4 ${
              status.isError
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
            }`}
          >
            {status.text}
          </div>
        )}

        {/* ১. LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-800 rounded-xl bg-slate-950 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setStatus(null);
                  }}
                  className="text-[11px] font-semibold text-sky-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-800 rounded-xl bg-slate-950 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow active:scale-95 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setStatus(null);
                }}
                className="text-sky-400 font-bold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          </form>
        )}

        {/* ২. SIGN UP FORM */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-800 rounded-xl bg-slate-950 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-800 rounded-xl bg-slate-950 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-800 rounded-xl bg-slate-950 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow active:scale-95 cursor-pointer"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStatus(null);
                }}
                className="text-sky-400 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* ৩. CHECK EMAIL NOTICE (সাইন আপের পর লিঙ্ক পাঠানোর মেসেজ) */}
        {mode === "check_email" && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ✉️
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Confirmation Link Sent</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                We've sent a verification link to <br />
                <span className="text-white font-bold">{email}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Click the confirmation link in the email to activate your account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setStatus(null);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* ৪. FORGOT PASSWORD (রিসেট লিংক পাঠানো) */}
        {mode === "forgot_password" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Your Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-800 rounded-xl bg-slate-950 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow active:scale-95 cursor-pointer"
            >
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStatus(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </p>
          </form>
        )}

        {/* ৫. RESET PASSWORD (ইমেইলের লিংকে ক্লিক করার পর নতুন পাসওয়ার্ড বসানো) */}
        {mode === "reset_password" && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Create New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-800 rounded-xl bg-slate-950 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow active:scale-95 cursor-pointer"
            >
              {loading ? "Saving New Password..." : "Save New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}