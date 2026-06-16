// Invitation link generation via Supabase Admin. We generate the link
// ourselves (instead of inviteUserByEmail) so the email is sent through Resend.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/shared/lib/env";

export interface InviteLink {
  userId: string;
  actionLink: string;
}

function redirectTo(): string {
  return `${serverEnv.appUrl()}/auth/callback?next=/set-password`;
}

/** Creates the auth user (if new) and returns a link to set the password. */
export async function generateInviteLink(
  admin: SupabaseClient,
  email: string,
): Promise<InviteLink> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: redirectTo() },
  });

  if (error || !data.user || !data.properties?.action_link) {
    throw new Error(error?.message ?? "No se pudo generar la invitación");
  }

  return { userId: data.user.id, actionLink: data.properties.action_link };
}

/** Re-issues a link for an already-invited user (who has not set a password). */
export async function regenerateInviteLink(
  admin: SupabaseClient,
  email: string,
): Promise<string> {
  // Try invite again; if the user already exists, fall back to a magic link.
  const invite = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: redirectTo() },
  });
  if (!invite.error && invite.data.properties?.action_link) {
    return invite.data.properties.action_link;
  }

  const magic = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: redirectTo() },
  });
  if (magic.error || !magic.data.properties?.action_link) {
    throw new Error(magic.error?.message ?? "No se pudo regenerar la invitación");
  }
  return magic.data.properties.action_link;
}

/** Blocks / unblocks an auth user (used when (de)activating a client). */
export async function setAuthUserBanned(
  admin: SupabaseClient,
  userId: string,
  banned: boolean,
): Promise<void> {
  await admin.auth.admin.updateUserById(userId, {
    ban_duration: banned ? "876000h" : "none",
  });
}
