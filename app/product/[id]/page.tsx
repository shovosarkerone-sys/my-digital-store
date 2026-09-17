import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import CryptoPayButton from "./CryptoPayButton";

// force-dynamic এর বদলে ৬০ সেকেন্ড ক্যাশিং (সাইট আর কখনোই লোডিংয়ে আটকে থাকবে না)
export const revalidate = 60;

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // প্রোডাক্ট তথ্য আনা
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  // ব্যাকগ্রাউন্ডে ভিউ বৃদ্ধি (পেজ লোড আটকাবে না)
  supabase.rpc("increment_views", { row_id: Number(id) }).then();

  const whatsappNumber = "8801797362397";
  const orderMessage = encodeURIComponent(
    `Hello! I want to purchase the digital product "${product.title}". Price: $${product.price}. Please provide payment instructions.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${orderMessage}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 selection:bg-sky-500 selection:text-white">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/category/${encodeURIComponent(product.category)}`}
          className="inline-flex items-center gap-1.5 mb-6 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
        >
          ← Back to {product.category}
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 mt-2">
          {/* প্রোডাক্ট ইমেজ */}
          <div className="relative h-72 md:h-full bg-slate-800 min-h-[350px] flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No Image Available
              </div>
            )}
          </div>

          {/* প্রোডাক্ট বিবরণ ও পেমেন্ট সেকশন */}
          <div className="p-6 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-block bg-sky-500/10 text-sky-400 text-xs px-3 py-1 rounded-full font-medium border border-sky-500/20">
                  {product.category}
                </span>
                <span className="text-xs text-slate-400">
                  👁️ {product.views || 0} views
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {product.title}
              </h1>

              <div className="text-3xl font-extrabold text-sky-400 mb-6">
                ${product.price}
              </div>

              <div className="border-t border-slate-800 pt-4 mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  Product Description:
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">⚡ Instant Auto-Delivery:</p>
                <p>License code and digital access are delivered immediately upon crypto payment.</p>
              </div>

              {/* অটোমেটিক Cryptomus / Binance বাটন */}
              <CryptoPayButton productId={product.id} price={product.price} />

              {/* ম্যানুয়াল WhatsApp বাটন */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-6 rounded-xl transition duration-200 text-center text-xs border border-slate-700 cursor-pointer"
              >
                <span>💬 Order via WhatsApp (Manual)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}