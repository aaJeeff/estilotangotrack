"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { homePathForRole, readRole } from "@/shared/lib/auth/roles";
import { serverEnv } from "@/shared/lib/env";

export interface ActionState {
  error?: string;
  message?: string;
}

const signInSchema = z.object({
  email: z.string().email("Ingresá un email válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { error: "Email o contraseña incorrectos." };
  }

  // Touch last-login timestamps (best-effort).
  await touchLastAccess(data.user.id);

  redirect(homePathForRole(readRole(data.user)));
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

/** Sets the password for an invited / recovering user (session set by callback). */
export async function setPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "El enlace expiró o ya fue usado. Pedí uno nuevo." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: "No se pudo guardar la contraseña. Intentá de nuevo." };
  }

  await touchLastAccess(user.id);
  redirect(homePathForRole(readRole(user)));
}

const emailSchema = z.object({ email: z.string().email("Ingresá un email válido") });

/** Requests a password-reset email. Always reports success (no account enumeration). */
export async function requestResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email inválido" };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${serverEnv.appUrl()}/auth/callback?next=/set-password`,
  });

  return {
    message:
      "Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function touchLastAccess(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
    await prisma.client.updateMany({
      where: { userId },
      data: { lastAccessAt: new Date() },
    });
  } catch {
    // Non-fatal: the User row may not exist yet during edge cases.
  }
}
