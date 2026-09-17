import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;

  let order = null;
  if (order_id) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_id", order_id)
      .single();
    order = data;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">
          ✓
        </div>

        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-1">
            Payment Completed
          </span>
          <h1 className="text-2xl font-black text-white">
            Thank You For Your Purchase!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Order Reference: <span className="font-mono text-slate-300">{order_id || "N/A"}</span>
          </p>
        </div>

        {order ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-3">
            <div>
              <span className="text-[11px] text-slate-500 block font-semibold">Product</span>
              <p className="text-sm font-bold text-white">{order.product_title}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block font-semibold">Amount Paid</span>
              <p className="text-sm font-black text-sky-400">${order.amount} {order.currency}</p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] text-emerald-400 font-bold block mb-1">
                ⚡ Instant Digital Product Delivery:
              </span>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-line select-all">
                {order.delivery_content || "Your instant license key / download access link is active."}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
            Payment received! Processing fulfillment to your registered email...
          </div>
        )}

        <Link
          href="/"
          className="inline-block w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition shadow"
        >
          Return to Marketplace
        </Link>
      </div>
    </div>
  );
}