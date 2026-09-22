import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy | Inskeys",
  description: "Privacy Policy, User Data Protection, and Google OAuth Data Disclosure for Inskeys Marketplace.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 antialiased selection:bg-sky-500 selection:text-white py-10 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* হেডার ও ব্র্যান্ডিং */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/icon.png"
                alt="Inskeys"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              Inskeys
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl transition font-medium"
          >
            ← Back to Store
          </Link>
        </div>

        {/* টাইটেল */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            🛡️ Official Data Disclosure & Legal Compliance
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Last Updated: September 2026 • Platform Version 2.4
          </p>
        </div>

        {/* মূল কনটেন্ট */}
        <div className="space-y-7 text-xs sm:text-sm leading-relaxed text-slate-300 relative z-10">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-sky-400 font-mono">01.</span> Introduction
            </h2>
            <p>
              Welcome to <strong>Inskeys</strong> (accessible at{" "}
              <Link href="https://inskeys.com" className="text-sky-400 hover:underline">
                https://inskeys.com
              </Link>
              ). We hold user confidentiality and security as our core tenets. This Privacy Policy details our operational data handling protocols, how buyer and merchant information is processed, and the measures we employ to secure transactions for game keys, digital vouchers, and software licenses.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-sky-400 font-mono">02.</span> Information We Collect
            </h2>
            <p>We process only the minimum dataset strictly necessary for secure peer-to-peer digital trade:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Account Credentials:</strong>{" "}
                Name, email address, password hash, and geographic region provided during buyer or merchant registration.
              </li>
              <li>
                <strong className="text-slate-200">Google OAuth Identity Data:</strong> If you choose to sign in via Google Authentication, we collect your verified primary email address, display name, and avatar URL strictly to establish and verify your Inskeys account session.
              </li>
              <li>
                <strong className="text-slate-200">Transactional History:</strong> Cryptographic order IDs, purchased license records, and merchant product catalog metadata. We never store private cryptocurrency wallet seeds or raw banking information.
              </li>
            </ul>
          </section>

          {/* Google Verification-এর জন্য অতীব জরুরি সেকশন */}
          <section className="space-y-3 bg-slate-950 border border-sky-500/30 rounded-2xl p-5 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔐</span>
              <h2 className="text-base font-bold text-sky-400">
                03. Google API Services User Data Policy & Limited Use
              </h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm">
              Inskeys' use and transfer to any other app of information received from Google APIs adheres strictly to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 underline font-semibold"
              >
                Google API Services User Data Policy
              </a>
              , including the <strong>Limited Use</strong> requirements.
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
              <p>• <strong>No Advertising Exploitation:</strong> We will never use data obtained through Google OAuth to build profiles for personalized or targeted advertising.</p>
              <p>• <strong>No Unauthorized Data Transfer:</strong> Google user data is never sold, leased, or transferred to third-party data brokers or marketing syndicates.</p>
              <p>• <strong>Human Inspection Limits:</strong> No human personnel will read your raw Google authentication records unless required for critical security investigations or with your explicit prior consent.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-sky-400 font-mono">04.</span> How We Utilize Collected Data
            </h2>
            <p>Your information is leveraged exclusively for legitimate marketplace operations:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>Facilitating instant or manual delivery of purchased digital vouchers and keys.</li>
              <li>Enforcing our 36-Hour Buyer Protection guarantee and dispute mediation.</li>
              <li>Maintaining fraud detection protocols and preventing rogue store duplicates.</li>
              <li>Transmitting transactional receipts, security OTP codes, and order dispute alerts.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-sky-400 font-mono">05.</span> Storage and Infrastructure Security
            </h2>
            <p>
              All customer metadata, order records, and internal messages are encrypted in transit using TLS 1.3 and at rest via AES-256 standards on our Supabase infrastructure. Strict Row-Level Security (RLS) policies isolate user records, ensuring no unauthorized member can access another user's private tickets, purchased keys, or direct messages.
            </p>
          </section>

          <section className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-sky-400 font-mono">06.</span> User Rights & Data Deletion (GDPR / CCPA)
            </h2>
            <p>
              Every user retains absolute ownership over their private data. You may request a machine-readable copy of your personal data or demand permanent deletion of your profile at any time.
            </p>
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 text-xs">
              <span className="text-slate-200 font-bold block">How to Request Permanent Account Purge:</span>
              <p className="text-slate-400">
                Submit an inquiry from your authenticated address to{" "}
                <a href="mailto:contact@inskeys.com" className="text-sky-400 font-mono underline">
                  contact@inskeys.com
                </a>{" "}
                or initiate an in-dashboard support ticket. All profile entries, message records, and authentication tokens will be permanently scrubbed within 48 hours.
              </p>
            </div>
          </section>

          <section className="space-y-2 border-t border-slate-800 pt-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-sky-400 font-mono">07.</span> Contact & Regulatory Inquiries
            </h2>
            <p>
              If you have any questions or regulatory concerns regarding our privacy architecture:
            </p>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-sky-400 space-y-1">
              <p>Email: contact@inskeys.com</p>
              <p>Platform: https://inskeys.com</p>
              <p>Compliance Officer: Inskeys Legal Concierge</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}