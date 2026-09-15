import { createClient } from "@supabase/supabase-js";

const cleanUrl = (rawUrl?: string): string => {
  const fallback = "https://evhwesdmwinemzwnizaf.supabase.co";
  if (!rawUrl || typeof rawUrl !== "string") return fallback;
  
  // কোনো উদ্ধৃতিচিহ্ন বা স্পেস থাকলে তা পরিষ্কার করা
  let url = rawUrl.trim().replace(/^["']|["']$/g, "");
  
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  
  try {
    new URL(url);
    return url;
  } catch {
    return fallback;
  }
};

const cleanKey = (rawKey?: string): string => {
  const fallback = "sb_publishable_2yD6hTX7ebePx-IK81DCcQ_8UW7_qqh";
  if (!rawKey || typeof rawKey !== "string") return fallback;
  return rawKey.trim().replace(/^["']|["']$/g, "");
};

const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = cleanKey(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseKey);