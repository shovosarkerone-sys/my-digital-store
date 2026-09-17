import { supabase } from "@/lib/supabase";
import StoreFront from "./components/StoreFront";

export const revalidate = 60; // পেজ ক্যাশ থাকবে, ফলে কোনো লোডিং ল্যাগ বা সার্ভার হ্যাং হবে না

export default async function HomePage() {
  // ডাটাবেজ থেকে ক্যাটাগরি ও প্রোডাক্ট ফেচ করা
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").order("id", { ascending: false }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
  ]);

  return (
    <StoreFront
      initialProducts={products || []}
      categories={categories || []}
    />
  );
}