import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://evhwesdmwinemzwnizaf.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_2yD6hTX7ebePx-IK81DCcQ_8UW7_qqh";

export const supabase = createClient(supabaseUrl, supabaseKey);