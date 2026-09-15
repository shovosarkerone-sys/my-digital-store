import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import SearchBar from "./components/SearchBar";

export const metadata: Metadata = {
  title: "ShovoStore — Premium Digital Assets Marketplace",
  description: "Browse and buy premium digital assets, software licenses, guides, and templates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-slate-950 text-white min-h-screen flex flex-col font-sans antialiased">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-900 px-4 sm:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="text-xl font-black text-sky-400 tracking-tight flex items-center gap-1.5">
              <span>ShovoStore.</span>
            </Link>
            <Link
              href="/admin"
              className="md:hidden text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
            >
              Admin
            </Link>
          </div>

          <div className="w-full md:w-96 lg:w-[480px]">
            <SearchBar />
          </div>

          <div className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-400">
            <Link href="/#popular" className="hover:text-white transition">Trending</Link>
            <Link href="/#categories" className="hover:text-white transition">Categories</Link>
            <Link
              href="/admin"
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl transition shadow-sm"
            >
              Admin Access
            </Link>
          </div>
        </header>

        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}