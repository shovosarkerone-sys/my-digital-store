"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// Complete Global ISO Country List with Country Codes for Flags
const ALL_COUNTRIES = [
  { name: "Afghanistan", code: "af" },
  { name: "Albania", code: "al" },
  { name: "Algeria", code: "dz" },
  { name: "Andorra", code: "ad" },
  { name: "Angola", code: "ao" },
  { name: "Antigua and Barbuda", code: "ag" },
  { name: "Argentina", code: "ar" },
  { name: "Armenia", code: "am" },
  { name: "Australia", code: "au" },
  { name: "Austria", code: "at" },
  { name: "Azerbaijan", code: "az" },
  { name: "Bahamas", code: "bs" },
  { name: "Bahrain", code: "bh" },
  { name: "Bangladesh", code: "bd" },
  { name: "Barbados", code: "bb" },
  { name: "Belarus", code: "by" },
  { name: "Belgium", code: "be" },
  { name: "Belize", code: "bz" },
  { name: "Benin", code: "bj" },
  { name: "Bhutan", code: "bt" },
  { name: "Bolivia", code: "bo" },
  { name: "Bosnia and Herzegovina", code: "ba" },
  { name: "Botswana", code: "bw" },
  { name: "Brazil", code: "br" },
  { name: "Brunei", code: "bn" },
  { name: "Bulgaria", code: "bg" },
  { name: "Burkina Faso", code: "bf" },
  { name: "Burundi", code: "bi" },
  { name: "Cabo Verde", code: "cv" },
  { name: "Cambodia", code: "kh" },
  { name: "Cameroon", code: "cm" },
  { name: "Canada", code: "ca" },
  { name: "Central African Republic", code: "cf" },
  { name: "Chad", code: "td" },
  { name: "Chile", code: "cl" },
  { name: "China", code: "cn" },
  { name: "Colombia", code: "co" },
  { name: "Comoros", code: "km" },
  { name: "Congo", code: "cg" },
  { name: "Costa Rica", code: "cr" },
  { name: "Croatia", code: "hr" },
  { name: "Cuba", code: "cu" },
  { name: "Cyprus", code: "cy" },
  { name: "Czech Republic", code: "cz" },
  { name: "Denmark", code: "dk" },
  { name: "Djibouti", code: "dj" },
  { name: "Dominica", code: "dm" },
  { name: "Dominican Republic", code: "do" },
  { name: "Ecuador", code: "ec" },
  { name: "Egypt", code: "eg" },
  { name: "El Salvador", code: "sv" },
  { name: "Equatorial Guinea", code: "gq" },
  { name: "Eritrea", code: "er" },
  { name: "Estonia", code: "ee" },
  { name: "Eswatini", code: "sz" },
  { name: "Ethiopia", code: "et" },
  { name: "Fiji", code: "fj" },
  { name: "Finland", code: "fi" },
  { name: "France", code: "fr" },
  { name: "Gabon", code: "ga" },
  { name: "Gambia", code: "gm" },
  { name: "Georgia", code: "ge" },
  { name: "Germany", code: "de" },
  { name: "Ghana", code: "gh" },
  { name: "Greece", code: "gr" },
  { name: "Grenada", code: "gd" },
  { name: "Guatemala", code: "gt" },
  { name: "Guinea", code: "gn" },
  { name: "Guyana", code: "gy" },
  { name: "Haiti", code: "ht" },
  { name: "Honduras", code: "hn" },
  { name: "Hungary", code: "hu" },
  { name: "Iceland", code: "is" },
  { name: "India", code: "in" },
  { name: "Indonesia", code: "id" },
  { name: "Iran", code: "ir" },
  { name: "Iraq", code: "iq" },
  { name: "Ireland", code: "ie" },
  { name: "Israel", code: "il" },
  { name: "Italy", code: "it" },
  { name: "Jamaica", code: "jm" },
  { name: "Japan", code: "jp" },
  { name: "Jordan", code: "jo" },
  { name: "Kazakhstan", code: "kz" },
  { name: "Kenya", code: "ke" },
  { name: "Kiribati", code: "ki" },
  { name: "Kuwait", code: "kw" },
  { name: "Kyrgyzstan", code: "kg" },
  { name: "Laos", code: "la" },
  { name: "Latvia", code: "lv" },
  { name: "Lebanon", code: "lb" },
  { name: "Lesotho", code: "ls" },
  { name: "Liberia", code: "lr" },
  { name: "Libya", code: "ly" },
  { name: "Liechtenstein", code: "li" },
  { name: "Lithuania", code: "lt" },
  { name: "Luxembourg", code: "lu" },
  { name: "Madagascar", code: "mg" },
  { name: "Malawi", code: "mw" },
  { name: "Malaysia", code: "my" },
  { name: "Maldives", code: "mv" },
  { name: "Mali", code: "ml" },
  { name: "Malta", code: "mt" },
  { name: "Marshall Islands", code: "mh" },
  { name: "Mauritania", code: "mr" },
  { name: "Mauritius", code: "mu" },
  { name: "Mexico", code: "mx" },
  { name: "Micronesia", code: "fm" },
  { name: "Moldova", code: "md" },
  { name: "Monaco", code: "mc" },
  { name: "Mongolia", code: "mn" },
  { name: "Montenegro", code: "me" },
  { name: "Morocco", code: "ma" },
  { name: "Mozambique", code: "mz" },
  { name: "Myanmar", code: "mm" },
  { name: "Namibia", code: "na" },
  { name: "Nauru", code: "nr" },
  { name: "Nepal", code: "np" },
  { name: "Netherlands", code: "nl" },
  { name: "New Zealand", code: "nz" },
  { name: "Nicaragua", code: "ni" },
  { name: "Niger", code: "ne" },
  { name: "Nigeria", code: "ng" },
  { name: "North Korea", code: "kp" },
  { name: "North Macedonia", code: "mk" },
  { name: "Norway", code: "no" },
  { name: "Oman", code: "om" },
  { name: "Pakistan", code: "pk" },
  { name: "Palau", code: "pw" },
  { name: "Palestine", code: "ps" },
  { name: "Panama", code: "pa" },
  { name: "Papua New Guinea", code: "pg" },
  { name: "Paraguay", code: "py" },
  { name: "Peru", code: "pe" },
  { name: "Philippines", code: "ph" },
  { name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" },
  { name: "Qatar", code: "qa" },
  { name: "Romania", code: "ro" },
  { name: "Russia", code: "ru" },
  { name: "Rwanda", code: "rw" },
  { name: "Saint Kitts and Nevis", code: "kn" },
  { name: "Saint Lucia", code: "lc" },
  { name: "Saint Vincent and the Grenadines", code: "vc" },
  { name: "Samoa", code: "ws" },
  { name: "San Marino", code: "sm" },
  { name: "Sao Tome and Principe", code: "st" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Senegal", code: "sn" },
  { name: "Serbia", code: "rs" },
  { name: "Seychelles", code: "sc" },
  { name: "Sierra Leone", code: "sl" },
  { name: "Singapore", code: "sg" },
  { name: "Slovakia", code: "sk" },
  { name: "Slovenia", code: "si" },
  { name: "Solomon Islands", code: "sb" },
  { name: "Somalia", code: "so" },
  { name: "South Africa", code: "za" },
  { name: "South Korea", code: "kr" },
  { name: "South Sudan", code: "ss" },
  { name: "Spain", code: "es" },
  { name: "Sri Lanka", code: "lk" },
  { name: "Sudan", code: "sd" },
  { name: "Suriname", code: "sr" },
  { name: "Sweden", code: "se" },
  { name: "Switzerland", code: "ch" },
  { name: "Syria", code: "sy" },
  { name: "Taiwan", code: "tw" },
  { name: "Tajikistan", code: "tj" },
  { name: "Tanzania", code: "tz" },
  { name: "Thailand", code: "th" },
  { name: "Timor-Leste", code: "tl" },
  { name: "Togo", code: "tg" },
  { name: "Tonga", code: "to" },
  { name: "Trinidad and Tobago", code: "tt" },
  { name: "Tunisia", code: "tn" },
  { name: "Turkey", code: "tr" },
  { name: "Turkmenistan", code: "tm" },
  { name: "Tuvalu", code: "tv" },
  { name: "Uganda", code: "ug" },
  { name: "Ukraine", code: "ua" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" },
  { name: "Uruguay", code: "uy" },
  { name: "Uzbekistan", code: "uz" },
  { name: "Vanuatu", code: "vu" },
  { name: "Vatican City", code: "va" },
  { name: "Venezuela", code: "ve" },
  { name: "Vietnam", code: "vn" },
  { name: "Yemen", code: "ye" },
  { name: "Zambia", code: "zm" },
  { name: "Zimbabwe", code: "zw" }
];

export default function BecomeSellerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form Fields
  const [shopName, setShopName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(
    ALL_COUNTRIES.find((c) => c.name === "Bangladesh") || ALL_COUNTRIES[0]
  );
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [description, setDescription] = useState("");
  
  // 3 Identity Document Options
  const [documentType, setDocumentType] = useState<
    "National ID Card (NID)" | "International Passport" | "Driver's License"
  >("National ID Card (NID)");
  const [documentNumber, setDocumentNumber] = useState("");

  // Front & Back Document Files
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  useEffect(() => {
    async function checkAuthAndSeller() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: existingSeller } = await supabase
        .from("sellers")
        .select("id, verification_status")
        .eq("id", user.id)
        .maybeSingle();

      if (existingSeller) {
        if (existingSeller.verification_status === "verified") {
          router.push("/seller-dashboard");
        } else {
          setApplicationSubmitted(true);
        }
        setLoading(false);
        return;
      }

      if (user.user_metadata?.country) {
        const matched = ALL_COUNTRIES.find(
          (c) => c.name.toLowerCase() === user.user_metadata.country.toLowerCase()
        );
        if (matched) setSelectedCountry(matched);
      }

      setLoading(false);
    }

    checkAuthAndSeller();
  }, [router]);

  // Click outside listener for Country dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg("Front photo file size must not exceed 8MB.");
        return;
      }
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg("Back photo file size must not exceed 8MB.");
        return;
      }
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
      setErrorMsg("");
    }
  };

  const uploadFileToStorage = async (file: File, side: "front" | "back") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `kyc/${user.id}_${side}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

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

    if (!documentNumber.trim()) {
      setErrorMsg("Please enter your official identification document number.");
      return;
    }

    if (!frontFile || !backFile) {
      setErrorMsg("Please upload both Front and Back photos of your identification document.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const frontUrl = await uploadFileToStorage(frontFile, "front");
      const backUrl = await uploadFileToStorage(backFile, "back");

      const { error } = await supabase.from("sellers").insert([
        {
          id: user.id,
          shop_name: shopName.trim(),
          country: selectedCountry.name,
          description: description.trim(),
          seller_level: "Level 1 Verified Merchant",
          document_type: documentType,
          document_number: documentNumber.trim(),
          document_front_url: frontUrl,
          document_back_url: backUrl,
          verification_status: "pending",
        },
      ]);

      if (error) throw error;

      setApplicationSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit merchant verification application.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCountries = ALL_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 font-sans text-sm transition-colors duration-200">
        Verifying account status...
      </div>
    );
  }

  // Application Pending Screen
  if (applicationSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 sm:p-6 selection:bg-sky-500 selection:text-white transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl dark:shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 mx-auto flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-500/10">
            ⏳
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Application Under Review</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your merchant application and identity documents have been submitted securely. Our compliance team will review your details shortly.
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-400 space-y-1 text-left font-mono">
            <div>Status: <span className="text-amber-600 dark:text-amber-400 font-bold uppercase">Pending Verification</span></div>
            <div>Safety: <span className="text-sky-600 dark:text-sky-400 font-bold">36-Hour Buyer Protection Standard</span></div>
          </div>
          <Link
            href="/"
            className="block w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl transition border border-slate-200 dark:border-slate-700"
          >
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 sm:p-6 md:p-10 selection:bg-sky-500 selection:text-white transition-colors duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl space-y-8">
        
        {/* Brand Header with Transparent Logo */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
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
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              Inskeys
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium"
          >
            ← Buyer Account
          </Link>
        </div>

        {/* Header Text */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Merchant Onboarding & KYC
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Register as a Verified Merchant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {user
              ? "Submit your store credentials and legal identity details to begin listing digital keys across Inskeys."
              : "Sign in with your Google account to start selling digital products and license keys."}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl text-xs bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20 leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* View if User Not Logged In */}
        {!user ? (
          <div className="space-y-5 py-2">
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                Merchant Identity Authentication
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                To safeguard buyer funds and adhere to global marketplace compliance, all merchants must authenticate before opening a storefront.
              </p>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 border border-slate-200 dark:border-slate-800 disabled:opacity-50 text-slate-800 dark:text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-3 cursor-pointer shadow-sm"
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
                className="text-xs text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
              >
                Prefer using email & password? Click here to Log In
              </Link>
            </div>
          </div>
        ) : (
          /* Merchant Onboarding Form */
          <form onSubmit={handleRegisterSeller} className="space-y-5">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Authenticated as:</span>
              <span className="text-sky-600 dark:text-sky-400 font-mono font-semibold">
                {user.email}
              </span>
            </div>

            {/* Store Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Store / Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Apex Codes, Global Voucher Store"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              {/* Country Selector with Flags */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Operating Country
                </label>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsCountryDropdownOpen(!isCountryDropdownOpen);
                    setCountrySearchQuery("");
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={`https://flagcdn.com/w40/${selectedCountry.code}.png`}
                      alt={selectedCountry.name}
                      className="w-5 h-3.5 object-cover rounded-xs shrink-0"
                    />
                    <span className="truncate font-medium">{selectedCountry.name}</span>
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isCountryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 space-y-2">
                    <div className="p-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search country..."
                        value={countrySearchQuery}
                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                      {filteredCountries.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No country found
                        </div>
                      ) : (
                        filteredCountries.map((c) => (
                          <div
                            key={c.code}
                            onClick={() => {
                              setSelectedCountry(c);
                              setIsCountryDropdownOpen(false);
                            }}
                            className={`p-2 rounded-xl flex items-center gap-2.5 text-xs cursor-pointer transition ${
                              selectedCountry.code === c.code
                                ? "bg-sky-500 text-white font-bold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <img
                              src={`https://flagcdn.com/w40/${c.code}.png`}
                              alt={c.name}
                              className="w-5 h-3.5 object-cover rounded-xs shrink-0"
                            />
                            <span className="truncate">{c.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Store Description{" "}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief overview of the products or licenses you offer..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            {/* KYC & Identity Verification */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
                <span className="text-sky-600 dark:text-sky-400 text-sm">🪪</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Identity Verification (KYC)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Select Document Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="National ID Card (NID)">National ID Card (NID)</option>
                    <option value="International Passport">International Passport</option>
                    <option value="Driver's License">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document Number
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Enter ID / Document number"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Both Front and Back Upload Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. Front Side */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-sm">
                  <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Front Side Photo
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                      {frontPreview ? (
                        <img src={frontPreview} alt="Front Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[10px]">No File</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <input
                        type="file"
                        id="doc-front-upload"
                        accept="image/*,application/pdf"
                        onChange={handleFrontFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="doc-front-upload"
                        className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer transition border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      >
                        {frontPreview ? "Change Front" : "Upload Front"}
                      </label>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">JPG, PNG, PDF (Max 8MB)</p>
                    </div>
                  </div>
                </div>

                {/* 2. Back Side */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-sm">
                  <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Back Side Photo
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                      {backPreview ? (
                        <img src={backPreview} alt="Back Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-[10px]">No File</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <input
                        type="file"
                        id="doc-back-upload"
                        accept="image/*,application/pdf"
                        onChange={handleBackFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="doc-back-upload"
                        className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer transition border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      >
                        {backPreview ? "Change Back" : "Upload Back"}
                      </label>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">JPG, PNG, PDF (Max 8MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant Compliance & Buyer Protection Agreement */}
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
                <svg
                  className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0"
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
                <span>Merchant Code of Conduct & Buyer Protection Terms</span>
              </div>

              <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-600 mt-0.5">•</span>
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">36-Hour Buyer Protection Hold:</strong>{" "}
                    All sales payouts remain safely held for 36 hours post-fulfillment to guarantee code validity and eliminate disputes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-600 mt-0.5">•</span>
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">Platform Integrity:</strong>{" "}
                    All customer resolutions and digital deliveries must remain strictly within the Inskeys platform.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-slate-600 mt-0.5">•</span>
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      Anti-Circumvention Policy:
                    </strong>{" "}
                    Exchanging direct off-platform contact info (Email, Telegram, WhatsApp) or requesting external payments will result in permanent store suspension.
                  </span>
                </li>
              </ul>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sky-500 focus:ring-sky-500/30 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition leading-snug">
                    I verify that my submitted identification is accurate and agree to comply with the Merchant Terms and 36-Hour Buyer Protection Policy.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-sky-500/20 cursor-pointer"
            >
              {submitting
                ? "Submitting Application & Documents..."
                : "Submit Merchant Application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}