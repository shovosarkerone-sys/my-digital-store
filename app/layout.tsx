import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LiveSupport from "./components/LiveSupport";
import { ThemeProvider } from "./components/ThemeProvider";
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white min-h-screen flex flex-col justify-between antialiased transition-colors duration-200`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex-1">{children}</div>

          <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur py-8 px-4 sm:px-8 mt-12 text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* ব্র্যান্ড ও কপিরাইট */}
              <div className="flex items-center gap-2">
                {/* লোগোটি বড় করা হয়েছে (w-8 h-8 এবং width/height 32) */}
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/icon.png"
                    alt="Inskeys Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm">
                  Inskeys
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  © 2026 All Rights Reserved
                </span>
              </div>

              {/* ফুটার লিঙ্কসমূহ */}
              <div className="flex items-center gap-5 text-[11px] font-semibold flex-wrap justify-center">
                <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition">
                  About Us
                </Link>
                <Link href="/support" className="hover:text-slate-900 dark:hover:text-white transition">
                  Support
                </Link>
                <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition">
                  Privacy Policy
                </Link>
                <Link href="/become-seller" className="text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition">
                  Become a Seller
                </Link>
                <a href="mailto:contact@inskeys.com" className="hover:text-sky-500 dark:hover:text-sky-400 transition font-mono">
                  contact@inskeys.com
                </a>
                
                {/* ফেসবুক পেজের লিংক ও অফিশিয়াল ব্লু আইকন */}
                <a 
                  href="https://facebook.com/inskeys" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#1877F2] hover:opacity-80 transition ml-2 flex items-center"
                  aria-label="Inskeys Facebook Page"
                >
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>

            </div>
          </footer>

          <LiveSupport />
        </ThemeProvider>
      </body>
    </html>
  );
}