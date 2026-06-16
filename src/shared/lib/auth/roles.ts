// Role helpers. Roles live in Supabase `app_metadata.role` (server-controlled),
// which lets the edge middleware gate routes without a database round-trip.

import type { User } from "@supabase/supabase-js";

export type AppRole = "ADMIN" | "CLIENT";

export function readRole(user: Pick<User, "app_metadata">): AppRole {
  const role = user.app_metadata?.role;
  return role === "ADMIN" ? "ADMIN" : "CLIENT";
}

/** Default landing path for a role. */
export function homePathForRole(role: AppRole): string {
  return role === "ADMIN" ? "/admin/dashboard" : "/portal/orders";
}
