// Supabase admin client (service-role key). SERVER ONLY.
// Bypasses RLS — used for privileged operations like inviting users.
// Never import this into client code.

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/shared/lib/env";

export function createSupabaseAdminClient() {
  return createClient(serverEnv.supabaseUrl(), serverEnv.supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
