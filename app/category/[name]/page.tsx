import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Product {
  id: number | string;
  title: string;
  price: number;
  category: string;
  image_url: string;
  description: string;
  views?: number;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedCategory = decodeURIComponent(name);

  // Fetch products by category
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("category", decodedCategory)
    .order("id", { ascending: false });

  if (!products) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-900 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-sky-400 tracking-tight">
            ShovoStore.
          </Link>

          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-1.5 rounded-lg transition"
          >
            ← Back to Store
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8 space-y-6">
        {/* Category Heading */}
        <div className="border-b border-slate-900 pb-4">
          <Link
            href="/"
            className="inline-block text-xs font-bold text-sky-400 hover:underline mb-2"
          >
            ← Back to Homepage
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {decodedCategory} <span className="text-sky-400">Products</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Showing {products.length} verified digital assets available in this category
          </p>
        </div>

        {/* Product Catalog */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-lg">
            <p className="text-sm text-slate-400 font-medium">
              No products found in this category yet.
            </p>
            <Link
              href="/"
              className="inline-block mt-3 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Grid: No description, full title, entire card clickable */}
            <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 items-stretch">
              {products.map((item: Product) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hover:border-sky-500 transition duration-200 flex flex-col justify-between group shadow-sm cursor-pointer block"
                >
                  <div className="relative bg-slate-950 border-b border-slate-800/80">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-28 object-cover group-hover:scale-105 transition duration-200"
                      />
                    ) : (
                      <div className="w-full h-28 bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                        No Image
                      </div>
                    )}
                    <span className="absolute top-1.5 right-1.5 bg-slate-950/80 backdrop-blur text-slate-300 text-[9px] px-1.5 py-0.5 rounded border border-slate-800">
                      👁️ {item.views || 0}
                    </span>
                  </div>

                  <div className="p-2.5 flex flex-col flex-grow justify-between">
                    <div>
                      <span className="text-[9px] text-sky-400 uppercase tracking-wider font-bold block mb-1">
                        {item.category || "Digital Asset"}
                      </span>
                      <h2 className="text-xs font-bold text-white leading-snug whitespace-normal break-words">
                        {item.title}
                      </h2>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
                      <span className="text-sm font-black text-sky-400">
                        ${item.price}
                      </span>
                      <span className="bg-sky-500 group-hover:bg-sky-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded transition whitespace-nowrap">
                        Buy Now
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile List: Horizontal rows */}
            <div className="flex flex-col gap-2.5 sm:hidden">
              {products.map((item: Product) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-3 hover:border-slate-700 active:bg-slate-800/60 transition shadow-sm cursor-pointer block"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-slate-950 rounded border border-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[9px] text-slate-500 font-bold">No Image</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider block">
                        {item.category || "Digital Asset"}
                      </span>
                      <h2 className="text-xs font-bold text-white leading-snug mt-0.5 whitespace-normal break-words">
                        {item.title}
                      </h2>
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        👁️ {item.views || 0} views
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center shrink-0 pl-1">
                    <span className="text-sm font-black text-sky-400 mb-1.5">
                      ${item.price}
                    </span>
                    <span className="bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded transition text-center shadow whitespace-nowrap">
                      Buy Now
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-xs text-slate-600 mt-12">
        © 2026 ShovoStore — All rights reserved.
      </footer>
    </div>
  );
}