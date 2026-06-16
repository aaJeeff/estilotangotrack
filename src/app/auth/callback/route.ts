// Exchanges the one-time code from Supabase email links (invitation, password
// recovery, magic link) for a session, then forwards to `next`.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
