import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedCategory = decodeURIComponent(name);

  // নির্দিষ্ট ক্যাটাগরির প্রোডাক্টগুলো ডাটাবেজ থেকে আনা
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .ilike("category", decodedCategory)
    .order("id", { ascending: false });

  if (!products) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 md:p-10 selection:bg-sky-500 selection:text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ব্যাক বাটন ও হেডার */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition"
          >
            ← Back to All Categories
          </Link>

          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block">
              Category Collection
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white mt-1 capitalize">
              {decodedCategory}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Total {products.length} products found in this category.
            </p>
          </div>
        </div>

        {/* লাইন-বাই-লাইন কম্প্যাক্ট প্রোডাক্ট ভিউ */}
        {products.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
            No products available currently in "{decodedCategory}".
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 group transition duration-200 shadow-lg hover:shadow-sky-500/5 cursor-pointer"
              >
                {/* থাম্বনেইল ছবি */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-700/60">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-slate-600 text-[10px]">No Image</span>
                    )}
                  </div>

                  {/* টাইটেল, ক্যাটাগরি ও ভিউজ */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      {product.category}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 sm:line-clamp-3 leading-snug group-hover:text-sky-300 transition">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      <span className="bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                        👁️ {product.views || 0} views
                      </span>
                      <span className="text-slate-500 hidden sm:inline">⚡ Instant Auto-Delivery</span>
                    </div>
                  </div>
                </div>

                {/* প্রাইস ও বাটন */}
                <div className="flex flex-col items-end justify-center gap-1.5 shrink-0 pl-2">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block leading-none">Price</span>
                    <span className="text-xs sm:text-base font-black text-sky-400 leading-tight">
                      ${product.price}
                    </span>
                  </div>
                  <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl transition whitespace-nowrap shadow-md shadow-sky-950">
                    Buy Now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}