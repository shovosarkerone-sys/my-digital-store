import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://evhwesdmwinemzwnizaf.supabase.co";
const SUPABASE_KEY = "sb_publishable_2yD6hTX7ebePx-IK8lDCcQ_8UW7_qqh";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);