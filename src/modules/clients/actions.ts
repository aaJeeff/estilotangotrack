"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { createSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import { requireRole } from "@/shared/lib/auth/session";
import { writeAudit } from "@/modules/audit/audit";
import { notificationSender } from "@/modules/notifications/infrastructure/resend-sender";
import type { FormState } from "@/shared/types/form";
import {
  generateInviteLink,
  regenerateInviteLink,
  setAuthUserBanned,
} from "./invite";

const clientSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresá el nombre completo"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  instagram: z.string().trim().optional().or(z.literal("")),
  whatsapp: z.string().trim().optional().or(z.literal("")),
});

export async function createClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("ADMIN");

  const parsed = clientSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    instagram: formData.get("instagram"),
    whatsapp: formData.get("whatsapp"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  const existing = await prisma.client.findUnique({ where: { email: input.email } });
  if (existing) {
    return { error: "Ya existe un cliente con ese email." };
  }

  // Create the auth user + invite link, then mirror into our tables.
  const supabaseAdmin = createSupabaseAdminClient();
  let invite;
  try {
    invite = await generateInviteLink(supabaseAdmin, input.email);
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `No se pudo invitar al cliente: ${err.message}`
          : "No se pudo invitar al cliente.",
    };
  }

  const client = await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: invite.userId },
      update: { email: input.email, role: "CLIENT" },
      create: { id: invite.userId, email: input.email, role: "CLIENT" },
    });
    return tx.client.create({
      data: {
        userId: invite.userId,
        fullName: input.fullName,
        email: input.email,
        instagram: input.instagram || null,
        whatsapp: input.whatsapp || null,
      },
    });
  });

  // Best-effort invitation email; the admin can resend from the client page.
  try {
    await notificationSender.sendInvitation({
      to: input.email,
      fullName: input.fullName,
      actionLink: invite.actionLink,
    });
  } catch (err) {
    console.error("[clients] invitation email failed", err);
  }

  await writeAudit({
    userId: admin.id,
    action: "client.create",
    entityType: "Client",
    entityId: client.id,
    after: { fullName: client.fullName, email: client.email },
  });

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${client.id}`);
}

export async function updateClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Cliente no encontrado" };

  const parsed = clientSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    instagram: formData.get("instagram"),
    whatsapp: formData.get("whatsapp"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  const before = await prisma.client.findUnique({ where: { id } });
  if (!before) return { error: "Cliente no encontrado" };

  await prisma.client.update({
    where: { id },
    data: {
      fullName: input.fullName,
      email: input.email,
      instagram: input.instagram || null,
      whatsapp: input.whatsapp || null,
    },
  });

  await writeAudit({
    userId: admin.id,
    action: "client.update",
    entityType: "Client",
    entityId: id,
    before: { fullName: before.fullName, email: before.email },
    after: { fullName: input.fullName, email: input.email },
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return { ok: true, message: "Cliente actualizado." };
}

export async function setClientActiveAction(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;

  const client = await prisma.client.update({
    where: { id },
    data: { isActive: active },
  });

  if (client.userId) {
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      await setAuthUserBanned(supabaseAdmin, client.userId, !active);
    } catch (err) {
      console.error("[clients] ban toggle failed", err);
    }
  }

  await writeAudit({
    userId: admin.id,
    action: active ? "client.activate" : "client.deactivate",
    entityType: "Client",
    entityId: id,
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
}

export async function resendInvitationAction(formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Cliente no encontrado" };

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return { error: "Cliente no encontrado" };

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const actionLink = await regenerateInviteLink(supabaseAdmin, client.email);
    await notificationSender.sendInvitation({
      to: client.email,
      fullName: client.fullName,
      actionLink,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "No se pudo reenviar la invitación.",
    };
  }

  await writeAudit({
    userId: admin.id,
    action: "client.resend_invitation",
    entityType: "Client",
    entityId: id,
  });

  return { ok: true, message: "Invitación reenviada." };
}
