// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
