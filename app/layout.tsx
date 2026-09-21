import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AiChatbot from "./components/AiChatbot";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inskeys — Premium Digital Marketplace",
  description: "Instant gift cards, game keys, and automated digital fulfillment.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen flex flex-col justify-between`}>
        <div className="flex-1">{children}</div>

        <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 sm:px-8 mt-12 text-xs text-slate-400">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* ব্র্যান্ড ও কপিরাইট */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/icon.png"
                  alt="Inskeys Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-white tracking-tight text-sm">Inskeys</span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-slate-500">© 2026 All Rights Reserved</span>
            </div>

            {/* ফুটার লিঙ্কসমূহ */}
            <div className="flex items-center gap-5 text-[11px] font-semibold flex-wrap justify-center">
              <Link href="/about" className="hover:text-white transition">
                About Us
              </Link>
              <Link href="/support" className="hover:text-white transition">
                Support
              </Link>
              <Link href="/privacy" className="hover:text-white transition">
                Privacy Policy
              </Link>
              <Link href="/become-seller" className="text-amber-400 hover:text-amber-300 transition">
                Become a Seller
              </Link>
              <a href="mailto:contact@inskeys.com" className="hover:text-sky-400 transition font-mono">
                contact@inskeys.com
              </a>
            </div>

          </div>
        </footer>

        <AiChatbot />
      </body>
    </html>
  );
}