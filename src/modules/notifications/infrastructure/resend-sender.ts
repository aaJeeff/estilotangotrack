import "server-only";
import { serverEnv } from "@/shared/lib/env";
import { getResend } from "./resend";
import { InvitationEmail } from "../templates/invitation-email";
import { StatusUpdateEmail } from "../templates/status-update-email";
import type {
  InvitationMessage,
  NotificationSender,
  SendResult,
  StatusUpdateMessage,
} from "../application/notification-sender";

export class ResendNotificationSender implements NotificationSender {
  async sendInvitation(msg: InvitationMessage): Promise<SendResult> {
    const { data, error } = await getResend().emails.send({
      from: serverEnv.emailFrom(),
      to: msg.to,
      subject: "Te invitamos a seguir tu pedido",
      react: InvitationEmail({ fullName: msg.fullName, actionLink: msg.actionLink }),
    });
    if (error) throw new Error(error.message);
    return { providerId: data?.id ?? null };
  }

  async sendStatusUpdate(msg: StatusUpdateMessage): Promise<SendResult> {
    const { data, error } = await getResend().emails.send({
      from: serverEnv.emailFrom(),
      to: msg.to,
      subject: `Tu pedido ${msg.orderNumber}: ${msg.statusLabel}`,
      react: StatusUpdateEmail({
        fullName: msg.fullName,
        orderNumber: msg.orderNumber,
        statusLabel: msg.statusLabel,
        helpText: msg.helpText,
        trackingUrl: msg.trackingUrl,
      }),
    });
    if (error) throw new Error(error.message);
    return { providerId: data?.id ?? null };
  }
}

// Default sender instance used by the app.
export const notificationSender: NotificationSender = new ResendNotificationSender();
