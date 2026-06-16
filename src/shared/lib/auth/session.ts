// Server-side session helpers. Use these in Server Components and Server Actions.
// They validate the Supabase session and resolve the mirrored `User` (+ `Client`)
// rows. Authorization is enforced here at the application layer (RLS is secondary).

import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { homePathForRole, readRole, type AppRole } from "./roles";

export interface CurrentUser {
  id: string;
  email: string;
  role: AppRole;
  /** The Client row, present for CLIENT users that have been linked. */
  clientId: string | null;
}

/**
 * Returns the authenticated user (validated against Supabase) joined with the
 * mirrored DB row, or null if there is no valid session.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = readRole(user);
  const client =
    role === "CLIENT"
      ? await prisma.client.findUnique({ where: { userId: user.id }, select: { id: true } })
      : null;

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    clientId: client?.id ?? null,
  };
}

/** Requires any authenticated user; redirects to /login otherwise. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires a specific role; redirects appropriately otherwise. */
export async function requireRole(role: AppRole): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) {
    redirect(homePathForRole(user.role));
  }
  return user;
}

/**
 * Ensures the current CLIENT owns the given order. Returns the current user.
 * Throws (via notFound) if the order does not belong to them. Admins bypass.
 */
export async function requireOrderAccess(orderId: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;

  const order = await prisma.order.findFirst({
    where: { id: orderId, client: { userId: user.id } },
    select: { id: true },
  });

  if (!order) {
    // Do not reveal existence of orders that are not theirs.
    redirect("/portal/orders");
  }
  return user;
}
