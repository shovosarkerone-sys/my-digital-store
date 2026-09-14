import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const resolvedParams = await params;
  const categoryName = decodeURIComponent(resolvedParams.name);

  // ডাটাবেস থেকে প্রোডাক্ট লোড করা
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .ilike("category", categoryName);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-block mb-6 text-sm text-sky-400 hover:underline"
        >
          ← ব্যাক টু হোমপেজ
        </Link>

        <h1 className="text-3xl font-bold mb-2 capitalize">
          {categoryName} প্রোডাক্টস
        </h1>
        <p className="text-slate-400 mb-8 text-sm">
          ডিজিটাল কালেকশন থেকে আপনার পছন্দের প্রোডাক্ট বেছে নিন
        </p>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-sky-500 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-sky-400">
                    ৳{item.price}
                  </span>
                  {/* এখন সরাসরি প্রোডাক্টের ডিটেইলস পেজে নিয়ে যাবে */}
                  <Link
                    href={`/product/${item.id}`}
                    className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
                  >
                    এখনই কিনুন →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <p className="text-slate-400">
              এই ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট যুক্ত করা হয়নি।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}