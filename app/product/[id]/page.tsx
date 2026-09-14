import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

// ক্যাশিং বন্ধ করে রিয়েলটাইম ভিউ কাউন্ট নিশ্চিত করা
export const dynamic = "force-dynamic";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // প্রোডাক্ট ভিজিট হলে স্বয়ংক্রিয়ভাবে ভিউ সংখ্যা ১ বাড়ানো
  await supabase.rpc("increment_views", { row_id: Number(id) });

  // ডাটাবেস থেকে প্রোডাক্টের তথ্য আনা
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  const whatsappNumber = "8801797362397";
  const orderMessage = encodeURIComponent(
    `হ্যালো! আমি "${product.title}" ডিজিটাল প্রোডাক্টটি কিনতে চাই। মূল্য: ৳${product.price}। পেমেন্ট প্রসেস জানাবেন।`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${orderMessage}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/category/${encodeURIComponent(product.category)}`}
          className="inline-block mb-6 text-sm text-sky-400 hover:underline"
        >
          ← ব্যাক টু {product.category}
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 mt-4">
          <div className="relative h-72 md:h-full bg-slate-800 min-h-[350px]">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                ছবি পাওয়া যায়নি
              </div>
            )}
          </div>

          <div className="p-6 md:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-block bg-sky-500/10 text-sky-400 text-xs px-3 py-1 rounded-full font-medium border border-sky-500/20">
                  {product.category}
                </span>
                <span className="text-xs text-slate-400">
                  👁️ {product.views || 0} বার দেখা হয়েছে
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {product.title}
              </h1>

              <div className="text-3xl font-extrabold text-sky-400 mb-6">
                ৳{product.price}
              </div>

              <div className="border-t border-slate-800 pt-4 mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  প্রোডাক্ট বিবরণ:
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">⚡ তাত্ক্ষণিক ডেলিভারি সুবিধা:</p>
                <p>বিকাশ/নগদ পেমেন্ট কনফার্মেশনের সাথে সাথেই ডাউনলোড লিঙ্ক বা অ্যাক্সেস দেওয়া হবে।</p>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 text-center shadow-lg shadow-emerald-950"
              >
                <span>💬 WhatsApp-এ অর্ডার করুন</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}