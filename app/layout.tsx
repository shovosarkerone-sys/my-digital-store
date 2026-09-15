import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SearchBar from "./components/SearchBar";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Store",
  description: "My Digital Store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* z-[100] দিয়ে সবার ওপরে রাখা হয়েছে যাতে নিচের কোনো উপাদান একে ব্লার না করতে পারে */}
        <header className="sticky top-0 z-[100] bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="font-bold text-xl text-blue-600 shrink-0">
              Store
            </Link>

            {/* সার্চবার কম্পোনেন্ট */}
            <div className="flex-1 max-w-md">
              <SearchBar />
            </div>

            <Link
              href="/admin"
              className="text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-600 shrink-0"
            >
              Admin
            </Link>
          </div>
        </header>

        {/* মূল পেজের কনটেন্ট */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}