// Audit logging. Call writeAudit from every admin mutation.

import "server-only";
import { prisma } from "@/shared/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface AuditInput {
  userId: string;
  action: string; // e.g. "client.create", "order.update_status"
  entityType: string; // e.g. "Client", "Order"
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before,
        after: input.after,
        ipAddress: input.ipAddress ?? undefined,
      },
    });
  } catch (err) {
    // Auditing must never break the primary operation.
    console.error("[audit] failed to write log", err);
  }
}
