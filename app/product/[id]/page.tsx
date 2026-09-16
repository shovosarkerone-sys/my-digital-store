import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

// Ensure real-time view count by disabling caching
export const dynamic = "force-dynamic";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Increment view count on product visit
  await supabase.rpc("increment_views", { row_id: Number(id) });

  // Fetch product details from database
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
    `Hello! I want to purchase the digital product "${product.title}". Price: $${product.price}. Please provide payment instructions.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${orderMessage}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/category/${encodeURIComponent(product.category)}`}
          className="inline-block mb-6 text-sm text-sky-400 hover:underline"
        >
          ← Back to {product.category}
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
                No Image Available
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

            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">⚡ Instant Delivery:</p>
                <p>Download link and access will be provided instantly upon payment confirmation.</p>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 text-center shadow-lg shadow-emerald-950"
              >
                <span>💬 Order via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}