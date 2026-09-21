import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy | Inskeys",
  description: "Privacy Policy and Google OAuth Data Disclosure for Inskeys marketplace.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 antialiased selection:bg-sky-500 selection:text-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* হেডার ও ব্র্যান্ডিং */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
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
            <span className="font-black text-base tracking-tight text-white">
              Inskeys
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        {/* টাইটেল */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: September 2026
          </p>
        </div>

        {/* মূল কনটেন্ট */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Introduction</h2>
            <p>
              Welcome to <strong>Inskeys</strong> (accessible at{" "}
              <Link href="https://inskeys.com" className="text-sky-400 hover:underline">
                https://inskeys.com
              </Link>
              ). We value your privacy and are committed to protecting your personal
              information. This Privacy Policy outlines our data handling practices,
              how we gather information when you use our marketplace for digital licenses,
              vouchers, and gaming assets, and your rights regarding that information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">
              2. Information We Collect
            </h2>
            <p>We only collect the minimal personal data required to operate securely:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                <strong className="text-slate-200">Account Credentials:</strong>{" "}
                Name, email address, and country when registering as a buyer or seller.
              </li>
              <li>
                <strong className="text-slate-200">Google OAuth Data:</strong> If you
                choose to authenticate using Google Sign-In, we receive your verified
                email address, full name, and avatar directly from Google to generate
                and authenticate your session.
              </li>
              <li>
                <strong className="text-slate-200">Transaction History:</strong> Records
                of purchased licenses, order vouchers, and merchant store submissions.
              </li>
            </ul>
          </section>

          <section className="space-y-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <h2 className="text-base font-bold text-sky-400">
              3. Google API Services User Data Policy
            </h2>
            <p>
              Inskeys complies with the{" "}
              <span className="text-white font-medium">
                Google API Services User Data Policy
              </span>
              , including the Limited Use requirements.
            </p>
            <p className="mt-2">
              Our use and transfer of information received from Google APIs to any
              other app adheres to the Google API Services User Data Policy. We never use
              Google user data for serving personalized advertising, and we do not
              transfer this data to third-party data brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">
              4. How We Use Your Information
            </h2>
            <p>We process your data strictly for legitimate operational purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Authenticating your account login and verifying merchant profiles.</li>
              <li>Delivering digital product keys and fulfilling escrow obligations.</li>
              <li>Preventing fraudulent transactions and platform circumvention.</li>
              <li>Sending essential account and transactional notifications.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">
              5. Data Protection and Third Parties
            </h2>
            <p>
              We do not sell, rent, or trade your personal information. Authentication
              data is stored securely using Supabase with row-level security protocols
              and industry-standard encryption (AES-256).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">
              6. Your Rights & Data Deletion
            </h2>
            <p>
              You have the right to inspect, correct, or request the permanent deletion
              of your account and personal data at any time. To request data deletion,
              simply contact our support team at{" "}
              <a
                href="mailto:contact@inskeys.com"
                className="text-sky-400 hover:underline"
              >
                contact@inskeys.com
              </a>
              , and all associated profile information will be purged within 48 hours.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-800 pt-4">
            <h2 className="text-base font-bold text-white">7. Contact Information</h2>
            <p>
              For inquiries regarding this Privacy Policy or account governance:
            </p>
            <p className="font-mono text-xs text-sky-400">
              Email: contact@inskeys.com <br />
              Website: https://inskeys.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}