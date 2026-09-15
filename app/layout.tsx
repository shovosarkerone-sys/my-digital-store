import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShovoStore — Premium Digital Assets Marketplace",
  description: "Browse and buy premium digital assets, software licenses, guides, and templates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}