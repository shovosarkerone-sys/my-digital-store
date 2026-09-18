import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AiChatbot from "./components/AiChatbot";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShovoStore — Premium Digital Marketplace",
  description: "Instant gift cards, game keys, and automated digital fulfillment.",
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

        {/* ফুটার */}
        <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 sm:px-8 mt-12 text-xs text-slate-400">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center font-black text-xs text-white">
                S
              </div>
              <span className="font-bold text-white tracking-tight">ShovoStore</span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-slate-500">© 2026 All Rights Reserved</span>
            </div>

            <div className="flex items-center gap-5 text-[11px] font-semibold">
              <Link href="/about" className="hover:text-white transition">
                About Us
              </Link>
              <Link href="/support" className="hover:text-white transition">
                Help & Support
              </Link>
              <Link href="/become-seller" className="text-amber-400 hover:text-amber-300 transition">
                Become a Seller
              </Link>
              <a href="mailto:shovosarkerone@gmail.com" className="hover:text-sky-400 transition font-mono">
                shovosarkerone@gmail.com
              </a>
            </div>
          </div>
        </footer>

        {/* ভাসমান এআই চ্যাটবট */}
        <AiChatbot />
      </body>
    </html>
  );
}