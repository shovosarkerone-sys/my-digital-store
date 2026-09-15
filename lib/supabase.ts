import { createClient } from "@supabase/supabase-js";

// লোকালহোস্টে যে আসল ক্রিডেনশিয়াল দিয়ে সফল হয়েছে, সরাসরি সেটাই যুক্ত করা হলো
const SUPABASE_URL = "https://evhwesdmwinemzwnizaf.supabase.co";
const SUPABASE_KEY = "sb_publishable_2yD6hTX7ebePx-IK81DCcQ_8UW7_qqh";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);