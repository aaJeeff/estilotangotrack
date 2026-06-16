// Supabase client bound to the request cookies (Server Components / Actions /
// Route Handlers). Uses the anon key; respects the authenticated session.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // `setAll` is called from Server Components in some flows where
          // mutating cookies throws; it is safe to ignore there because the
          // session is refreshed by the middleware instead.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op (called from a Server Component)
          }
        },
      },
    },
  );
}
