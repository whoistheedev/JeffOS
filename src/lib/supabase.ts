// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

// ✅ Use the new key names exactly as shown in your Supabase Dashboard
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)
